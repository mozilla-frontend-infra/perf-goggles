module.exports = {
  use: [
    '@neutrinojs/airbnb',
    [
      '@neutrinojs/react',
      {
        html: {
          title: 'perf-goggles'
        }
      }
    ],
    ['@neutrinojs/mocha', { recursive: true }],
    (neutrino) => {
      // Read https://stackoverflow.com/a/36623117
      // This is the key to making React Router work with neutrino
      // Fixes issue with nested routes e.g /index/garbage
      neutrino.config.output.publicPath('/');

      // Hacks to replace react-hot-loader with latest version (v4)
      // This probably has to do with React Hot Loader v4 being released,
      // which is a breaking change from the version included in the build
      // side of Neutrino.
      neutrino.config
        .entry('index')
          .batch(index => {
            const values = index
              .values()
              .filter(value => !value.includes('react-hot-loader'));
            index
              .clear()
              .merge(values);
          });

      neutrino.config.module
        .rule('compile')
          .use('babel')
            .tap(options => {
              options.plugins.forEach((plugin, index) => {

                if (Array.isArray(plugin)) {
                  if (plugin[0].includes('react-hot-loader')) {
                    plugin[0] = require.resolve('react-hot-loader/babel');
                  }
                } else {
                  if (plugin.includes('react-hot-loader')) {
                    options.plugins[index] = require.resolve('react-hot-loader/babel');
                  }
                }
              });

              return options;
            });
    }
  ]
};
