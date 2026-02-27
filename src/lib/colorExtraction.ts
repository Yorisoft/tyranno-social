/**
 * Extract dominant colors from an image using canvas API
 */
export async function extractColorsFromImage(imageUrl: string): Promise<{
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Create canvas and get context
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Scale down image for faster processing
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Color extraction using simplified k-means clustering
        const colors: { r: number; g: number; b: number; count: number }[] = [];
        const pixelStep = 4; // Sample every 4th pixel for performance
        
        for (let i = 0; i < data.length; i += pixelStep * 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Skip transparent or very dark/light pixels
          if (a < 128 || (r < 20 && g < 20 && b < 20) || (r > 235 && g > 235 && b > 235)) {
            continue;
          }
          
          // Find similar color or add new
          let found = false;
          for (const color of colors) {
            const diff = Math.abs(color.r - r) + Math.abs(color.g - g) + Math.abs(color.b - b);
            if (diff < 50) {
              color.r = Math.round((color.r * color.count + r) / (color.count + 1));
              color.g = Math.round((color.g * color.count + g) / (color.count + 1));
              color.b = Math.round((color.b * color.count + b) / (color.count + 1));
              color.count++;
              found = true;
              break;
            }
          }
          
          if (!found) {
            colors.push({ r, g, b, count: 1 });
          }
        }
        
        // Sort by count and get top colors
        colors.sort((a, b) => b.count - a.count);
        
        if (colors.length === 0) {
          reject(new Error('No colors found in image'));
          return;
        }
        
        // Get dominant colors
        const [primary, secondary, tertiary] = colors.slice(0, 3);
        
        // Calculate complementary accent color
        const accent = tertiary || secondary || primary;
        
        // Determine if image is generally dark or light
        const avgBrightness = colors.reduce((sum, c) => 
          sum + (c.r * 0.299 + c.g * 0.587 + c.b * 0.114) * c.count, 0
        ) / colors.reduce((sum, c) => sum + c.count, 0);
        
        const isDark = avgBrightness < 128;
        
        // Convert to hex
        const toHex = (r: number, g: number, b: number) => 
          `#${[r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
        
        // Generate color scheme
        const primaryHex = toHex(primary.r, primary.g, primary.b);
        const secondaryHex = toHex(secondary?.r || primary.r, secondary?.g || primary.g, secondary?.b || primary.b);
        const accentHex = toHex(accent.r, accent.g, accent.b);
        
        resolve({
          primary: primaryHex,
          secondary: secondaryHex,
          accent: accentHex,
          background: isDark ? '#0a0a0a' : '#ffffff',
          foreground: isDark ? '#fafafa' : '#0a0a0a',
        });
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Convert hex color to HSL
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
