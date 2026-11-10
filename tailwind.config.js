/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Cairo', 'Tahoma', 'Segoe UI', 'system-ui', 'sans-serif'] },
      colors: {
        // Medical blue (primary), calm green (secondary), red reserved for urgent warnings, amber for "orange" risk tier only
        brand: { 50:'#eef5fc',100:'#d9e8f7',200:'#b3d1ef',300:'#7fb2e3',400:'#4b90d2',500:'#2a77c0',600:'#1d6fb8',700:'#175893',800:'#154a78',900:'#123d63',950:'#0b2640' },
        calm:  { 50:'#ecf8f2',100:'#d2efe0',200:'#a6dfc2',300:'#6fc89e',400:'#3fae7b',500:'#239363',600:'#18774f',700:'#155f41',800:'#134c36',900:'#103f2e' },
        urgent:{ 50:'#fdeceb',100:'#fbd5d3',500:'#d92d20',600:'#b42318',700:'#912018',900:'#55160c' },
        tier:  { amber:'#b45309', amberSoft:'#fdf0dc', amberDark:'#fbbf24', amberSoftDark:'#3a2a0e' }
      },
      borderRadius: { xl2: '1.25rem' }
    }
  },
  plugins: []
};
