/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // iOS-inspired color palette
        primary: {
          DEFAULT: '#007AFF',
          dark: '#0A84FF',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#5856D6',
          dark: '#5E5CE6',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#34C759',
          dark: '#32D74B',
        },
        warning: {
          DEFAULT: '#FF9500',
          dark: '#FF9F0A',
        },
        destructive: {
          DEFAULT: '#FF3B30',
          dark: '#FF453A',
        },
        muted: {
          DEFAULT: '#8E8E93',
          dark: '#98989D',
          foreground: '#636366',
        },
        background: {
          DEFAULT: '#F2F2F7',
          dark: '#000000',
        },
        foreground: {
          DEFAULT: '#000000',
          dark: '#FFFFFF',
        },
        card: {
          DEFAULT: 'rgba(255,255,255,0.7)',
          dark: 'rgba(28,28,30,0.7)',
        },
        border: {
          DEFAULT: 'rgba(0,0,0,0.08)',
          dark: 'rgba(255,255,255,0.15)',
        },
        input: {
          DEFAULT: 'rgba(118,118,128,0.12)',
          dark: 'rgba(118,118,128,0.24)',
        },
        glass: {
          light: 'rgba(255,255,255,0.6)',
          dark: 'rgba(28,28,30,0.6)',
          border: {
            light: 'rgba(255,255,255,0.3)',
            dark: 'rgba(255,255,255,0.1)',
          }
        }
      },
      borderRadius: {
        'ios-sm': '8px',
        'ios': '12px',
        'ios-lg': '16px',
        'ios-xl': '20px',
        'ios-2xl': '24px',
      },
      backdropBlur: {
        'ios': '20px',
        'ios-heavy': '40px',
      },
      boxShadow: {
        'ios-sm': '0 1px 3px rgba(0,0,0,0.12)',
        'ios': '0 4px 6px rgba(0,0,0,0.15)',
        'ios-lg': '0 10px 15px rgba(0,0,0,0.20)',
        'glass': '0 8px 32px rgba(0,0,0,0.10)',
        'glass-dark': '0 8px 32px rgba(0,0,0,0.25)',
      },
      fontFamily: {
        'ios': ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'ios-xs': ['12px', '16px'],
        'ios-sm': ['14px', '19px'],
        'ios-base': ['16px', '22px'],
        'ios-lg': ['18px', '24px'],
        'ios-xl': ['20px', '26px'],
        'ios-2xl': ['24px', '30px'],
        'ios-3xl': ['32px', '38px'],
      },
      animation: {
        'ios-bounce': 'ios-bounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ios-pulse': 'ios-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'ios-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'ios-pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}