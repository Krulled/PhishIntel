/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        background: '#0b0f14',
        foreground: '#e6eaf0',
        muted: '#1a2029',
        border: '#1f2732',
        card: '#0f141b',
        ring: '#6b8ea8',
        accent: {
          green: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        soft: '0 6px 24px rgba(0,0,0,0.25)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.2s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
};