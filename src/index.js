import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material';
import { store } from './store/store';
import './index.css';
import App from './App';
import { useEffect, useState } from 'react';

const getInitialMode = () => {
  const saved = localStorage.getItem('darkMode');
  if (saved !== null) return saved === 'true';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const AppWithTheme = () => {
  const [darkMode, setDarkMode] = useState(getInitialMode());
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);
const theme = createTheme({
  palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#2196f3' },
      secondary: { main: '#ff4081' },
  },
});
  return (
    <ThemeProvider theme={theme}>
      <App setDarkMode={setDarkMode} darkMode={darkMode} />
    </ThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppWithTheme />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
