/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'paper': {
          light: '#FAFAFA',
          dark: '#0F0F0F',
        },
        'ink': {
          primary: '#0F0F0F',
          secondary: '#4A5568',
          muted: '#A0AEC0',
        },
        'accent': {
          ember: '#E53E3E',
          twilight: '#3182CE',
        },
        'coral': {
          50: '#FFF5F5',
          100: '#FED7D7', 
          200: '#FEB2B2',
          300: '#FC8181',
          400: '#F56565',
          500: '#E53E3E',
          600: '#C53030',
          700: '#9B2C2C',
          800: '#822727',
          900: '#63171B',
        }
      },
      fontFamily: {
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'serif': ['Georgia', 'serif'],
      },
      animation: {
        'breathing': 'breathing 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer-slow': 'shimmer-slow 3s ease-in-out infinite',
      },
      keyframes: {
        breathing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('flowbite/plugin'),
  ],
  darkMode: 'class',
}

