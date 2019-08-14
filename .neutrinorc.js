const airbnbBase = require('@neutrinojs/airbnb-base');
const library = require('@neutrinojs/library');
const mocha = require('@neutrinojs/mocha');

module.exports = {
  options: {
    root: __dirname,
  },
  use: [
    airbnbBase(),
    library({
      name: 'perf-goggles'
    }),
    mocha(),
  ],
};
