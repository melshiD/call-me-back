/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your existing primary color from main.css
        primary: {
          DEFAULT: '#667eea',
          dark: '#5568d3',
        },
      },
      keyframes: {
        scrollUp: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2220px)' }, // 5 cards × (420px + 24px gap) = 2220px
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-10px) translateY(-50%)', opacity: '0' },
          '100%': { transform: 'translateX(0) translateY(-50%)', opacity: '1' },
        },
      },
      animation: {
        scrollUp: 'scrollUp 40s linear infinite',
        slideInLeft: 'slideInLeft 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
