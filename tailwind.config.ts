import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#002b5a',
        'on-primary': '#ffffff',
        'on-primary-fixed': '#001b3d',
        'on-primary-fixed-variant': '#0c4687',
        'primary-container': '#004182',
        'on-primary-container': '#84aff7',
        'primary-fixed': '#d6e3ff',
        'primary-fixed-dim': '#a9c7ff',
        
        secondary: '#006493',
        'on-secondary': '#ffffff',
        'on-secondary-fixed': '#001e2f',
        'on-secondary-fixed-variant': '#004b70',
        'secondary-container': '#44b7fd',
        'on-secondary-container': '#004668',
        'secondary-fixed': '#cae6ff',
        'secondary-fixed-dim': '#8ccdff',
        
        tertiary: '#4e1c00',
        'on-tertiary': '#ffffff',
        'on-tertiary-fixed': '#351000',
        'on-tertiary-fixed-variant': '#783206',
        'tertiary-container': '#712d02',
        'on-tertiary-container': '#f79564',
        'tertiary-fixed': '#ffdbcb',
        'tertiary-fixed-dim': '#ffb693',
        
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        
        surface: '#f8f9ff',
        'on-surface': '#0b1c30',
        'on-surface-variant': '#424750',
        'surface-bright': '#f8f9ff',
        'surface-dim': '#cbdbf5',
        'surface-container': '#e5eeff',
        'surface-container-high': '#dce9ff',
        'surface-container-highest': '#d3e4fe',
        'surface-container-low': '#eff4ff',
        'surface-container-lowest': '#ffffff',
        
        background: '#f8f9ff',
        'on-background': '#0b1c30',
        
        outline: '#737781',
        'outline-variant': '#c3c6d2',
        
        'inverse-surface': '#213145',
        'inverse-on-surface': '#eaf1ff',
        'inverse-primary': '#a9c7ff',
        
        'surface-tint': '#2f5ea1',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        'headline-lg': ['Public Sans'],
        'headline-lg-mobile': ['Public Sans'],
        'headline-md': ['Public Sans'],
        'headline-sm': ['Public Sans'],
        'body-lg': ['Public Sans'],
        'body-md': ['Public Sans'],
        'body-sm': ['Public Sans'],
        'label-md': ['Public Sans'],
        'data-tabular': ['Public Sans'],
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'data-tabular': ['13px', { lineHeight: '16px', fontWeight: '400' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        base: '4px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        'margin-mobile': '16px',
        'margin-desktop': '32px',
        gutter: '20px',
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem',
      },
    },
  },
  plugins: [],
};

export default config;
