/** @type {import('tailwindcss').Config} */

// Los valores reales viven en src/styles/index.css como variables --color-*.
// Aquí solo se les da nombre para usarlos como clases: bg-primary, text-ink, border-selva-border, etc.
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

const estado = (name) => ({
  DEFAULT: token(name),
  soft: token(`${name}-soft`),
  border: token(`${name}-border`),
  strong: token(`${name}-strong`),
});

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          light: token('primary-50'),
          50: token('primary-50'),
          dark: token('primary-dark'),
        },
        background: token('background'),
        surface: {
          DEFAULT: token('surface'),
          subtle: token('surface-subtle'),
        },
        ink: {
          DEFAULT: token('ink'),
          light: token('ink-light'),
          muted: token('ink-muted'),
        },
        border: token('border'),
        field: token('field'),
        selva: estado('selva'),
        warning: estado('warning'),
        destructive: estado('destructive'),
        info: estado('info'),
      },
      borderColor: {
        DEFAULT: token('border'),
      },
      boxShadow: {
        subtle: '0 1px 2px rgb(23 32 51 / 0.06), 0 1px 3px rgb(23 32 51 / 0.08)',
        floating: '0 10px 25px -5px rgb(23 32 51 / 0.18), 0 8px 10px -6px rgb(23 32 51 / 0.12)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
