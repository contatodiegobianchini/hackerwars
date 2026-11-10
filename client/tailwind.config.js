/** @type {import('tailwindcss').Config} */

/*
 * "Lan house de madrugada" theme.
 *
 * Legacy views were written for light cards (bg-white + text-gray-900). Instead of
 * patching each screen with CSS overrides, every Tailwind color is remapped per
 * utility type: backgrounds become night-blue surfaces, text becomes light ink and
 * borders become quiet dividers. Semantic hues are kept but tuned to the palette:
 * emerald = done (neon ciano), red = police/danger (neon magenta), blue = info and
 * amber/purple = player actions (fósforo).
 */

const scale = (map) => Object.fromEntries(Object.entries(map).flatMap(([keys, value]) => keys.split(',').map(k => [k, value])));

const bg = {
  gray: scale({ '50': '#20274A', '100': '#252D54', '200': '#2E3660', '300': '#3D4675', '400': '#4A5385', '500': '#5A6394', '600': '#2A3260', '700': '#262E57', '800': '#232A4F', '900': '#181D38', '950': '#0F1326' }),
  green: scale({ '50': '#132C38', '100': '#163543', '200': '#1B4252', '300': '#1F8E95', '400': '#26C2C8', '500': '#2DE2E6', '600': '#138A8D', '700': '#0F7276', '800': '#0C5A5E', '900': '#0A4346', '950': '#082C30' }),
  red: scale({ '50': '#33173A', '100': '#3D1A42', '200': '#4D1F4F', '300': '#A3245F', '400': '#F02A80', '500': '#FF2E88', '600': '#D61F72', '700': '#B01A5E', '800': '#7F1847', '900': '#561535', '950': '#381128' }),
  amber: scale({ '50': '#2E2A2E', '100': '#3A3226', '200': '#4A3E28', '300': '#C98B33', '400': '#FFC56B', '500': '#FFB547', '600': '#E89C2E', '700': '#C27F1F', '800': '#8A5A17', '900': '#5A3B12', '950': '#2E2210' }),
  blue: scale({ '50': '#1C2650', '100': '#22305E', '200': '#2A3A70', '300': '#3F64B8', '400': '#6FA3FF', '500': '#4D8DFF', '600': '#3C78E6', '700': '#2F60BF', '800': '#24498F', '900': '#1B3566', '950': '#121F40' }),
};
const text = {
  gray: scale({ '50,950': '#F4EFE3', '100,900': '#ECE6D6', '800': '#E2DDCF', '700': '#C9CDE2', '600': '#AEB4D2', '500': '#9AA1C4', '400': '#8A91B5', '300': '#C3C7DD', '200': '#DCDCE8' }),
  green: scale({ '50,100,200,300,400': '#9AF0F2', '500,600': '#2DE2E6', '700,800,900,950': '#7FEAEE' }),
  red: scale({ '50,100,200,300': '#FFB0D2', '400,500': '#FF5FA2', '600,700': '#FF2E88', '800,900,950': '#FF8AB8' }),
  amber: scale({ '50,100,200,300,400': '#FFD08A', '500,600': '#FFB547', '700,800,900,950': '#FFC56B' }),
  blue: scale({ '50,100,200,300,400': '#A9C6FF', '500,600': '#7FAEFF', '700,800,900,950': '#9CC0FF' }),
};
const border = {
  gray: scale({ '50,100,200,600,700,800,900,950': '#2E3660', '300': '#3D4675', '400,500': '#4A5385' }),
  green: scale({ '50,100,200': '#1E4E5A', '300,400,500': '#1F8E95', '600,700,800,900,950': '#18606A' }),
  red: scale({ '50,100,200,300': '#6B2550', '400,500,600': '#D61F72', '700,800,900,950': '#561535' }),
  amber: scale({ '50,100,200,300': '#6B5228', '400,500,600': '#C98B33', '700,800,900,950': '#5A3B12' }),
  blue: scale({ '50,100,200,300': '#2F4C8A', '400,500,600': '#3F64B8', '700,800,900,950': '#24498F' }),
};

// Tailwind palette names → semantic family.
const families = {
  gray: 'gray', slate: 'gray', zinc: 'gray', neutral: 'gray', stone: 'gray',
  emerald: 'green', green: 'green', teal: 'green', lime: 'green',
  red: 'red', rose: 'red',
  amber: 'amber', yellow: 'amber', orange: 'amber', purple: 'amber', violet: 'amber', fuchsia: 'amber', pink: 'amber',
  blue: 'blue', sky: 'blue', cyan: 'blue', indigo: 'blue',
};
const build = (source, extra) => ({
  transparent: 'transparent', current: 'currentColor', inherit: 'inherit',
  ...Object.fromEntries(Object.entries(families).map(([name, fam]) => [name, source[fam]])),
  ...extra,
});

const ink = '#0B0E1E';
const backgroundColors = build(bg, { white: '#1C2242', black: '#FFB547', ink });
const textColors = build(text, { white: '#ECE6D6', black: '#13172C', ink });
const borderColors = build(border, { white: '#2E3660', black: '#3D4675', ink, DEFAULT: '#2E3660' });

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: backgroundColors,
    backgroundColor: backgroundColors,
    gradientColorStops: backgroundColors,
    textColor: textColors,
    placeholderColor: textColors,
    borderColor: borderColors,
    divideColor: borderColors,
    ringColor: { ...borderColors, DEFAULT: '#FFB547' },
    outlineColor: { ...borderColors, DEFAULT: '#FFB547' },
    fill: { ...textColors, none: 'none' },
    stroke: { ...textColors, none: 'none' },
    borderRadius: { none: '0', sm: '2px', DEFAULT: '3px', md: '4px', lg: '4px', xl: '6px', '2xl': '8px', '3xl': '10px', full: '9999px' },
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['"Big Shoulders Display"', '"Arial Narrow"', 'Impact', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        sm: '0 1px 0 rgba(5, 7, 18, .35)',
        DEFAULT: '0 1px 0 rgba(5, 7, 18, .35)',
        md: '0 6px 16px rgba(5, 7, 18, .35)',
        lg: '0 10px 26px rgba(5, 7, 18, .45)',
        xl: '0 14px 34px rgba(5, 7, 18, .55)',
        '2xl': '0 20px 48px rgba(5, 7, 18, .6)',
      },
    },
  },
  plugins: [],
};
