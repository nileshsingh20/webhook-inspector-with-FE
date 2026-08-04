import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: mode === 'dark' ? '#818cf8' : '#4f46e5' },
      background: {
        default: mode === 'dark' ? '#0a0b0f' : '#f7f7f9',
        paper: mode === 'dark' ? '#101218' : '#ffffff',
      },
      text: mode === 'dark'
        ? {
            primary: '#e8e9ed',
            secondary: '#a1a1aa',
            disabled: '#71717a',
          }
        : {
            primary: '#18181b',
            secondary: '#52525b',
            disabled: '#71717a',
          },
      divider: mode === 'dark' ? '#1f222b' : '#e4e4e7',
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", -apple-system, "Segoe UI", sans-serif',
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.mode === 'dark' ? '#1f222b' : '#e4e4e7'}`,
          }),
        },
      },
    },
  });