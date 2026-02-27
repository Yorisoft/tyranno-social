import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/hooks/useAppContext';
import { useToast } from '@/hooks/useToast';
import { extractColorsFromImage, hexToHSL } from '@/lib/colorExtraction';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function PersonalizedThemeManager() {
  const { config, updateConfig } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasPersonalizedTheme = !!config.personalizedTheme;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, WebP, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB for local storage)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Convert to data URL for local storage
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        
        try {
          // Extract colors from image
          const colors = await extractColorsFromImage(dataUrl);
          
          // Apply colors to CSS variables
          applyPersonalizedTheme(colors, dataUrl);
          
          // Save to config
          updateConfig((current) => ({
            ...current,
            personalizedTheme: {
              wallpaperUrl: dataUrl,
              primaryColor: colors.primary,
              secondaryColor: colors.secondary,
              accentColor: colors.accent,
              backgroundColor: colors.background,
              foregroundColor: colors.foreground,
            },
          }));
          
          toast({
            title: 'Wallpaper uploaded!',
            description: 'Your personalized theme has been applied.',
          });
        } catch (error) {
          console.error('Failed to extract colors:', error);
          toast({
            title: 'Failed to process image',
            description: 'Could not extract colors from the image. Please try a different image.',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: 'Failed to read file',
          description: 'There was an error reading the file. Please try again.',
          variant: 'destructive',
        });
        setIsProcessing(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload wallpaper:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading the wallpaper.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveWallpaper = () => {
    // Remove personalized theme from config
    updateConfig((current) => {
      const newConfig = { ...current };
      delete newConfig.personalizedTheme;
      return newConfig;
    });

    // Remove CSS variables
    removePersonalizedTheme();

    toast({
      title: 'Wallpaper removed',
      description: 'Your personalized theme has been removed.',
    });
  };

  return (
    <div className="space-y-4">
      {hasPersonalizedTheme ? (
        <div className="space-y-3">
          {/* Preview */}
          <Card className="overflow-hidden border-2 border-primary/20">
            <div 
              className="h-32 bg-cover bg-center relative"
              style={{ backgroundImage: `url(${config.personalizedTheme!.wallpaperUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex gap-1">
                  {[
                    config.personalizedTheme!.primaryColor,
                    config.personalizedTheme!.secondaryColor,
                    config.personalizedTheme!.accentColor,
                  ].map((color, i) => (
                    <div
                      key={i}
                      className="h-6 w-6 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Change Wallpaper
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveWallpaper}
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-8 rounded-md border-2 border-dashed bg-muted/20 text-center">
            <ImagePlus className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Upload a wallpaper to personalize your theme
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Wallpaper
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

/**
 * Apply personalized theme colors to CSS variables
 */
function applyPersonalizedTheme(colors: {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}, wallpaperUrl: string) {
  const root = document.documentElement;
  
  // Convert colors to HSL for CSS variables
  const primaryHSL = hexToHSL(colors.primary);
  const accentHSL = hexToHSL(colors.accent);
  const bgHSL = hexToHSL(colors.background);
  const fgHSL = hexToHSL(colors.foreground);
  
  // Set CSS variables
  root.style.setProperty('--primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
  root.style.setProperty('--accent', `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`);
  root.style.setProperty('--background', `${bgHSL.h} ${bgHSL.s}% ${bgHSL.l}%`);
  root.style.setProperty('--foreground', `${fgHSL.h} ${fgHSL.s}% ${fgHSL.l}%`);
  
  // Set wallpaper
  root.style.setProperty('--wallpaper-url', `url(${wallpaperUrl})`);
  root.classList.add('personalized-theme');
  
  // Determine if dark or light based on background
  if (bgHSL.l < 50) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

/**
 * Remove personalized theme and restore defaults
 */
function removePersonalizedTheme() {
  const root = document.documentElement;
  
  // Remove personalized class and wallpaper
  root.classList.remove('personalized-theme');
  root.style.removeProperty('--wallpaper-url');
  
  // Note: CSS variables will be restored by the theme system
}

/**
 * Initialize personalized theme on app load
 */
export function initializePersonalizedTheme(personalizedTheme?: {
  wallpaperUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
}) {
  if (personalizedTheme) {
    applyPersonalizedTheme(
      {
        primary: personalizedTheme.primaryColor,
        secondary: personalizedTheme.secondaryColor,
        accent: personalizedTheme.accentColor,
        background: personalizedTheme.backgroundColor,
        foreground: personalizedTheme.foregroundColor,
      },
      personalizedTheme.wallpaperUrl
    );
  } else {
    removePersonalizedTheme();
  }
}
