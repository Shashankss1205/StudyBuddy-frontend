import React, { createContext, useContext, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, PaletteMode } from '@mui/material';
import { useThemeMode } from '../hooks/useThemeMode';

// Define theme context
interface ThemeContextType {
  mode: PaletteMode;
  toggleThemeMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleThemeMode: () => {}
});

// Hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { mode, toggleThemeMode } = useThemeMode();
  
  // Create theme with current mode
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode: mode as PaletteMode,
        primary: {
          main: mode === 'dark' ? '#90caf9' : '#1976d2',
        },
        secondary: {
          main: mode === 'dark' ? '#f48fb1' : '#dc004e',
        },
        background: {
          default: mode === 'dark' ? '#121212' : '#f5f5f5',
          paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        }
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'dark' ? '#272727' : '#1976d2',
            }
          }
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: mode === 'dark' ? '#272727' : '#ffffff',
            }
          }
        }
      }
    }),
  [mode]);
  
  return (
    <ThemeContext.Provider value={{ mode: mode as PaletteMode, toggleThemeMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 