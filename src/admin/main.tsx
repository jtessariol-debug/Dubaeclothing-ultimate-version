import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AdminRouter } from './routes/AdminRouter';

const rootElement = document.getElementById('admin-root');

if (!rootElement) {
  throw new Error('Admin root element was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter basename="/admin">
      <AdminRouter />
    </BrowserRouter>
  </React.StrictMode>,
);
