import React from 'react';
import ReactDOM from 'react-dom/client';
import { DirectionProvider, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DirectionProvider>
      <MantineProvider defaultColorScheme="dark">
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </MantineProvider>
    </DirectionProvider>
  </React.StrictMode>
);
