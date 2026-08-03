import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

/**
 * Tailwind config for the Freelancezero design system.
 *
 * Two color layers:
 *  1. shadcn/ui semantic tokens (via CSS vars) drive app UI + light/dark theming.
 *  2. Explicit `navy` and `brand` (emerald) scales drive the marketing surface,
 *     where dark bands stay dark regardless of the user's theme — the premium,
 *     Stripe/Linear-style contrast the homepage relies on.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1200px' },
    },
    // Type scale: every step is the Tailwind default × 0.8 (line heights
    // included) — feedback: overall page text should be 20% smaller. Spacing
    // is deliberately untouched; only text shrinks.
    fontSize: {
      xs: ['0.6rem', { lineHeight: '0.8rem' }],
      sm: ['0.7rem', { lineHeight: '1rem' }],
      base: ['0.8rem', { lineHeight: '1.2rem' }],
      lg: ['0.9rem', { lineHeight: '1.4rem' }],
      xl: ['1rem', { lineHeight: '1.4rem' }],
      '2xl': ['1.2rem', { lineHeight: '1.6rem' }],
      '3xl': ['1.5rem', { lineHeight: '1.8rem' }],
      '4xl': ['1.8rem', { lineHeight: '2rem' }],
      '5xl': ['2.4rem', { lineHeight: '1' }],
      '6xl': ['3rem', { lineHeight: '1' }],
      '7xl': ['3.6rem', { lineHeight: '1' }],
      '8xl': ['4.8rem', { lineHeight: '1' }],
      '9xl': ['6.4rem', { lineHeight: '1' }],
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Marketing brand scales (fixed, theme-independent).
        navy: {
          950: '#060A14',
          900: '#0A1020',
          850: '#0E1628',
          800: '#131D33',
          700: '#1D2A45',
          600: '#2A3B5C',
          500: '#3B4E75',
          400: '#5A6E97',
          300: '#8595B5',
        },
        // Brand blue, anchored on the logo mark (#2E5BF0).
        brand: {
          50: '#eef4fe',
          100: '#dbe9fd',
          200: '#bcd6fb',
          300: '#8fb7f8',
          400: '#6394f4',
          500: '#2e5bf0',
          600: '#2548cf',
          700: '#1f3ba9',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        glow: '0 0 80px -20px rgba(46, 91, 240, 0.45)',
        'card-hover': '0 20px 50px -20px rgba(6, 10, 20, 0.35)',
        float: '0 40px 80px -30px rgba(6, 10, 20, 0.55)',
      },
      backgroundImage: {
        'grid-navy':
          'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.6s ease-out both',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
