/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
        'shimmer': 'shimmer 2s infinite',
        'fadeIn': 'fadeIn 0.6s ease-out',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            'box-shadow': '0 0 20px rgba(139, 92, 246, 0.3)'
          },
          '50%': {
            'box-shadow': '0 0 30px rgba(139, 92, 246, 0.6)'
          },
        },
        'float': {
          '0%, 100%': {
            'transform': 'translateY(0px)'
          },
          '50%': {
            'transform': 'translateY(-10px)'
          },
        },
        'spin-slow': {
          'from': {
            'transform': 'rotate(0deg)'
          },
          'to': {
            'transform': 'rotate(360deg)'
          },
        },
        'shimmer': {
          '0%': {
            'background-position': '-200% center'
          },
          '100%': {
            'background-position': '200% center'
          },
        },
        'fadeIn': {
          'from': {
            'opacity': '0',
            'transform': 'translateY(30px)'
          },
          'to': {
            'opacity': '1',
            'transform': 'translateY(0)'
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      colors: {
        'cyber-purple': {
          50: '#f3f1ff',
          100: '#ebe5ff',
          200: '#d9ceff',
          300: '#bea6ff',
          400: '#9f75ff',
          500: '#843dff',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        'neon-cyan': {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
      },
      fontFamily: {
        'cyber': ['Orbitron', 'monospace'],
        'futura': ['Futura', 'Arial', 'sans-serif'],
      },
      blur: {
        '4xl': '72px',
        '5xl': '96px',
      },
    },
  },
  plugins: [],
};
