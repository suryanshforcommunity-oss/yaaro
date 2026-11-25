import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F4EBDD',
        'cream-light': '#FDF9F2',
        tomato: '#E95D43',
        'tomato-dark': '#CE4B33',
        deepgreen: '#263F32',
        'deepgreen-dark': '#1C3127',
        butter: '#F2C75C',
        'butter-light': '#FDF4D8',
        sand: '#E6DCCB',
        yaaro: {
          primary: {
            50: '#fdf3f0',
            100: '#fbe4df',
            200: '#f7ccc3',
            300: '#f1aba0',
            400: '#eb8072',
            500: '#e95d43', // Signature Tomato Red
            600: '#d9472e',
            700: '#b6341f',
            800: '#922c1d',
            900: '#772a1e',
            950: '#40120b',
          },
          secondary: {
            50: '#f2f6f4',
            100: '#e2ece7',
            200: '#c7dad0',
            300: '#a3c0b1',
            400: '#7ba08d',
            500: '#263f32', // Deep Forest Green
            600: '#1f3429',
            700: '#1a2b22',
            800: '#16231c',
            900: '#131e18',
            950: '#0a100d',
          },
          accent: {
            50: '#fefbf3',
            100: '#fdf5e2',
            200: '#fbe9c0',
            300: '#f8d995',
            400: '#f5c664',
            500: '#f2c75c', // Butter Yellow
            600: '#d9a93f',
            700: '#b5842d',
            800: '#926727',
            900: '#775323',
          },
          dark: '#1c3127',
          surface: '#fdf9f2',
          muted: '#59413c',
        },
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', "'Plus Jakarta Sans'", 'system-ui', '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'],
        body: ['var(--font-sans)', "'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
        mono: ['var(--font-sans)', "'Plus Jakarta Sans'", 'system-ui', '-apple-system', 'sans-serif'],
        cursive: ["'Dancing Script'", "'Caveat'", 'cursive'],
      },
      borderRadius: {
        'yaaro-sm': '2px',
        'yaaro': '4px',
        'yaaro-lg': '8px',
        'yaaro-xl': '12px',
      },
      boxShadow: {
        'editorial': '3px 3px 0px #263F32',
        'editorial-lg': '6px 6px 0px #263F32',
        'editorial-xl': '8px 8px 0px #263F32',
        'editorial-tomato': '4px 4px 0px #E95D43',
        'editorial-butter': '3px 3px 0px #F2C75C',
      },
    },
  },
  plugins: [],
}

export default config
