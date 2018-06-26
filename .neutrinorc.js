module.exports = {
  use: [
    '@neutrinojs/airbnb-base',
    [
      '@neutrinojs/library',
      {
        name: 'perf-goggles'
      }
    ],
    ['@neutrinojs/mocha', { recursive: true }]
  ]
};
