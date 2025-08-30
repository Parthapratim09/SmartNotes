// postcss.config.js

export default { // Use export default
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Add other PostCSS plugins here if needed
    // Example: cssnano for minification (install with npm install -D cssnano)
    // cssnano: process.env.NODE_ENV === 'production' ? {} : false,
  },
};

