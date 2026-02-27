import { useLocalStorage } from './useLocalStorage';
import { useCurrentUser } from './useCurrentUser';

/**
 * Hook for managing NSFW filter preference
 * 
 * For non-logged-in users: Always filter NSFW content (cannot be disabled)
 * For logged-in users: Default to filtering, but can be toggled off
 */
export function useNSFWFilter() {
  const { user } = useCurrentUser();
  const [filterEnabled, setFilterEnabled] = useLocalStorage('nsfw-filter-enabled', true);

  // For non-logged-in users, always filter
  const shouldFilter = !user || filterEnabled;

  // Only logged-in users can toggle the filter
  const canToggle = !!user;

  return {
    shouldFilter,
    filterEnabled,
    setFilterEnabled,
    canToggle,
  };
}
