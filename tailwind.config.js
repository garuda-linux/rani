const { join } = require('path');
const tailwindPrimeUi = require('tailwindcss-primeui');
const tailwindCatppuccin = require('@catppuccin/tailwindcss');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}')],
  theme: {
    extend: {},
  },
  plugins: [tailwindCatppuccin({ defaultFlavour: 'mocha' }), tailwindPrimeUi],
};
