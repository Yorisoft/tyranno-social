import { type Theme } from "@/contexts/AppContext";
import { useAppContext } from "@/hooks/useAppContext";

/**
 * Hook to get and set the active theme
 * @returns Theme context with theme and setTheme
 */
export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const { config, updateConfig } = useAppContext();

  return {
    theme: config.theme,
    setTheme: (theme: Theme) => {
      if (theme === config.theme) return;
      updateConfig((currentConfig) => ({
        ...currentConfig,
        theme,
      }));
      setTimeout(() => window.location.reload(), 50);
    }
  }
}