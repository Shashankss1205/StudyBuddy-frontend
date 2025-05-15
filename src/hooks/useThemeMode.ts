import { useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';

export const useThemeMode = () => {
  // Check for saved theme preference or use device preference
  const getSavedTheme = (): ThemeMode => {
    const savedTheme = localStorage.getItem('theme-mode');
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // If no saved theme, use the device preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  };
  
  const [mode, setMode] = useState<ThemeMode>(getSavedTheme);
  
  // Update theme mode and save to local storage
  const toggleThemeMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };
  
  // Apply the theme by adding/removing dark class to body
  useEffect(() => {
    document.body.dataset.theme = mode;
    
    // Also update system UI colors if supported
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', mode === 'dark' ? '#121212' : '#ffffff');
    }
  }, [mode]);
  
  return { mode, toggleThemeMode };
}; 