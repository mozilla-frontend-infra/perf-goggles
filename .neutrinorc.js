module.exports = {
  options: {
    root: __dirname,
  },
  use: [
    '@neutrinojs/airbnb-base',
    [
      '@neutrinojs/library',
      {
        name: 'perf-goggles'
      }
    ],
    '@neutrinojs/mocha'
  ]
};
