import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Paintbrush } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const DEFAULT_HUE = 345; // Burgundy/rose

const PRESET_COLORS = [
  { name: 'Burgundy (Default)', hue: 345 },
  { name: 'Blue', hue: 210 },
  { name: 'Green', hue: 150 },
  { name: 'Purple', hue: 270 },
  { name: 'Orange', hue: 30 },
  { name: 'Pink', hue: 330 },
  { name: 'Teal', hue: 180 },
  { name: 'Amber', hue: 45 },
];

export function ColorThemeSelector() {
  const [colorHue, setColorHue] = useLocalStorage<number>(
    'nostr:color-hue',
    DEFAULT_HUE
  );

  const [hue, setHue] = useState(colorHue);

  // Apply custom CSS variables when hue changes
  useEffect(() => {
    const root = document.documentElement;

    // Light mode colors
    root.style.setProperty('--primary', `${hue} 65% 45%`);
    root.style.setProperty('--ring', `${hue} 65% 45%`);
    root.style.setProperty('--sidebar-primary', `${hue} 65% 45%`);
    root.style.setProperty('--sidebar-ring', `${hue} 65% 45%`);
    root.style.setProperty('--accent', `${hue} 40% 92%`);
    root.style.setProperty('--secondary', `${hue} 20% 95%`);
    root.style.setProperty('--muted', `${hue} 15% 94%`);
    root.style.setProperty('--border', `${hue} 20% 88%`);
    root.style.setProperty('--input', `${hue} 20% 88%`);

    // Create a style element for dark mode
    let darkModeStyle = document.getElementById('dark-mode-colors');
    if (!darkModeStyle) {
      darkModeStyle = document.createElement('style');
      darkModeStyle.id = 'dark-mode-colors';
      document.head.appendChild(darkModeStyle);
    }

    darkModeStyle.textContent = `
      .dark {
        /* Apply custom hue to all elements with appropriate saturation */
        --background: ${hue} 8% 7%;
        --card: ${hue} 12% 10%;
        --popover: ${hue} 12% 10%;
        --primary: ${hue} 70% 60%;
        --ring: ${hue} 70% 60%;
        --secondary: ${hue} 8% 15%;
        --muted: ${hue} 8% 14%;
        --accent: ${hue} 10% 16%;
        --border: ${hue} 8% 18%;
        --input: ${hue} 8% 18%;
        --destructive: ${hue === 0 ? '0' : hue} 70% 50%;
        --sidebar-background: ${hue} 8% 8%;
        --sidebar-primary: ${hue} 70% 60%;
        --sidebar-accent: ${hue} 8% 14%;
        --sidebar-border: ${hue} 8% 16%;
        --sidebar-ring: ${hue} 70% 60%;
      }
    `;
  }, [hue]);

  const handleHueChange = (value: number) => {
    setHue(value);
    setColorHue(value);
  };

  const applyPreset = (preset: typeof PRESET_COLORS[0]) => {
    setHue(preset.hue);
    setColorHue(preset.hue);
  };

  const resetToDefault = () => {
    setHue(DEFAULT_HUE);
    setColorHue(DEFAULT_HUE);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Paintbrush className="h-4 w-4" />
          <span className="hidden sm:inline">Colors</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Theme Colors</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="p-4 space-y-6">
          {/* Single Color Picker */}
          <div className="space-y-2">
            <Label htmlFor="hue" className="text-sm font-medium">
              Theme Color
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="hue"
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => handleHueChange(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, 
                    hsl(0, 70%, 50%), 
                    hsl(60, 70%, 50%), 
                    hsl(120, 70%, 50%), 
                    hsl(180, 70%, 50%), 
                    hsl(240, 70%, 50%), 
                    hsl(300, 70%, 50%), 
                    hsl(360, 70%, 50%))`,
                }}
              />
              <div className="flex gap-2">
                <div
                  className="w-10 h-10 rounded-md border-2 border-border shrink-0"
                  style={{ backgroundColor: `hsl(${hue}, 65%, 45%)` }}
                  title="Light mode preview"
                />
                <div
                  className="w-10 h-10 rounded-md border-2 border-border shrink-0"
                  style={{ backgroundColor: `hsl(${hue}, 70%, 60%)` }}
                  title="Dark mode preview"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Adjusts the color for both light and dark themes
            </p>
          </div>

          <DropdownMenuSeparator />

          {/* Preset Colors */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Presets</Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="group relative aspect-square rounded-md border-2 hover:border-primary transition-colors overflow-hidden"
                  style={{
                    borderColor: hue === preset.hue ? `hsl(${hue}, 70%, 60%)` : 'hsl(var(--border))',
                    backgroundColor: `hsl(${preset.hue}, 12%, 10%)`,
                  }}
                  title={preset.name}
                >
                  <div
                    className="absolute inset-0 top-0 bottom-1/2"
                    style={{ backgroundColor: `hsl(${preset.hue}, 65%, 45%)` }}
                  />
                  <div
                    className="absolute inset-0 top-1/2 bottom-0"
                    style={{ backgroundColor: `hsl(${preset.hue}, 70%, 60%)` }}
                  />
                  {hue === preset.hue && (
                    <div className="absolute inset-0 ring-2 ring-white ring-inset" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="w-full"
          >
            Reset to Default
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
