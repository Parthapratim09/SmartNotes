// tailwind.config.js
// If you want to use require in a file with "type": "module", you'd typically need a .cjs extension,
// but for standard config files, using export default is the idiomatic ES Modules way.

/** @type {import('tailwindcss').Config} */
export default { // Use export default
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx,vue,svelte}",
    // Add any other paths where your Tailwind classes are used
  ],
  theme: {
    extend: {
      // Your custom colors, fonts, spacing, etc.
      colors: {
        'my-primary': '#4CAF50',
        'my-secondary': '#FFC107',
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins you need
    // For example: require('@tailwindcss/forms') would become:
    // (await import('@tailwindcss/forms')).default,
    // But usually, common plugins are designed to work directly with ESM configs.
    // So just:
    // import forms from '@tailwindcss/forms';
    // forms,
    // if it's an ESM-compatible plugin.
    // For now, let's keep it simple.
  ],
};