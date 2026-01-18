import { useState, useEffect } from 'react';

// Custom hook for dark mode with proper cleanup to prevent memory leaks
function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(colorScheme.matches);

    const handler = (e) => setIsDarkMode(e.matches);
    colorScheme.addEventListener('change', handler);

    return () => colorScheme.removeEventListener('change', handler);
  }, []);

  return isDarkMode;
}

export default useDarkMode;
