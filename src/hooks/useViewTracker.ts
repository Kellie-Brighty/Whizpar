import { useRef, useCallback } from 'react';

export const useViewTracker = (
  postId: string,
  onView: () => void,
  timeThreshold: number = 3000
) => {
  const viewTimeoutRef = useRef<NodeJS.Timeout>();
  const hasStartedViewingRef = useRef(false);

  const handleVisibilityChange = useCallback((isVisible: boolean) => {
    if (isVisible && !hasStartedViewingRef.current) {
      hasStartedViewingRef.current = true;
      viewTimeoutRef.current = setTimeout(() => {
        onView();
      }, timeThreshold);
    } else if (!isVisible && hasStartedViewingRef.current) {
      if (viewTimeoutRef.current) {
        clearTimeout(viewTimeoutRef.current);
      }
      hasStartedViewingRef.current = false;
    }
  }, [onView, timeThreshold]);

  return handleVisibilityChange;
}; 