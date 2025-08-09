import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div data-theme="dark" className="min-h-screen bg-[#0b0e16]">
      <App />
    </div>
  </React.StrictMode>,
)
