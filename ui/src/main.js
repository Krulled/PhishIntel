import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './routes/Home';
import Scan from './routes/Scan';
import './index.css';
const router = createBrowserRouter([
    { path: '/', element: _jsx(Home, {}) },
    { path: '/scan/:uuid', element: _jsx(Scan, {}) },
]);
const el = document.getElementById('root');
createRoot(el).render(_jsx(React.StrictMode, { children: _jsx(RouterProvider, { router: router }) }));
