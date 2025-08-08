import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './routes/Home';
import Scan from './routes/Scan';
const router = createBrowserRouter([
    { path: '/', element: _jsx(Home, {}) },
    { path: '/scan/:id', element: _jsx(Scan, {}) },
]);
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx("div", { "data-theme": "dark", children: _jsx(RouterProvider, { router: router }) }) }));
