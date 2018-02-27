import React from 'react';
import MetricsGraphics from 'react-metrics-graphics';
import propTypes from 'prop-types';

const Benchmark = ({ data }) => (
  <MetricsGraphics
    data={[data]}
    width={600}
    height={250}
    x_accessor="datetime"
    y_accessor="value"
  />
);

Benchmark.propTypes = {
  data: propTypes.arrayOf(propTypes.object).isRequired,
};

export default Benchmark;
