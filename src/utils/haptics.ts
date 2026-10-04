export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(40);
          break;
        case 'success':
          navigator.vibrate([10, 30, 20]);
          break;
        case 'error':
          navigator.vibrate([30, 40, 30]);
          break;
        default:
          navigator.vibrate(10);
      }
    } catch (e) {
      // Ignore
    }
  }
};
