import React from 'react';
import MetricsGraphics from 'react-metrics-graphics';
import propTypes from 'prop-types';

const Benchmark = ({ data, graphOptions }) => (
  <MetricsGraphics
    data={[data]}
    {...graphOptions}
  />
);

Benchmark.propTypes = {
  data: propTypes.arrayOf(propTypes.object).isRequired,
  graphOptions: propTypes.shape({}).isRequired,
};

export default Benchmark;
