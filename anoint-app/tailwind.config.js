/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Garamond', 'Georgia', 'serif'],
      },
      animation: {
        float: 'float 20s ease-in-out infinite',
        'float-delay-2': 'float 20s ease-in-out 2s infinite',
        'float-delay-4': 'float 20s ease-in-out 4s infinite',
        drift: 'drift 25s ease-in-out infinite',
        'drift-reverse': 'drift-reverse 30s ease-in-out infinite',
        fadeInOut: 'fadeInOut 4s ease-in-out infinite',
        'fadeInOut-slow': 'fadeInOut 8s ease-in-out infinite',
        slideAcross: 'slideAcross 15s linear infinite',
        'slideAcross-reverse': 'slideAcross-reverse 20s linear infinite',
        rotate: 'rotate 20s linear infinite',
        'rotate-reverse': 'rotate-reverse 25s linear infinite',
        bounce: 'bounce 2s ease-in-out infinite',
        zigzag: 'zigzag 10s ease-in-out infinite',
        spiral: 'spiral 15s linear infinite',
        wave: 'wave 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        drift: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '33%': { transform: 'translate(30px, -30px) rotate(120deg)' },
          '66%': { transform: 'translate(-20px, 20px) rotate(240deg)' },
          '100%': { transform: 'translate(0, 0) rotate(360deg)' },
        },
        'drift-reverse': {
          '0%': { transform: 'translate(0, 0) rotate(360deg)' },
          '33%': { transform: 'translate(-30px, 30px) rotate(240deg)' },
          '66%': { transform: 'translate(20px, -20px) rotate(120deg)' },
          '100%': { transform: 'translate(0, 0) rotate(0deg)' },
        },
        fadeInOut: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' },
        },
        slideAcross: {
          '0%': { transform: 'translateX(-100vw)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        'slideAcross-reverse': {
          '0%': { transform: 'translateX(100vw)' },
          '100%': { transform: 'translateX(-100vw)' },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'rotate-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        zigzag: {
          '0%, 100%': { transform: 'translateX(0) translateY(0)' },
          '25%': { transform: 'translateX(20px) translateY(-20px)' },
          '50%': { transform: 'translateX(-20px) translateY(-40px)' },
          '75%': { transform: 'translateX(40px) translateY(-20px)' },
        },
        spiral: {
          '0%': { transform: 'rotate(0deg) translateX(0px)' },
          '100%': { transform: 'rotate(360deg) translateX(100px)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0) scaleY(1)' },
          '50%': { transform: 'translateY(-10px) scaleY(1.1)' },
        },
      },
    },
  },
  plugins: [],
}