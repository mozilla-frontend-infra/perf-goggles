import propTypes from 'prop-types';
import PerfherderContainer from '../containers/perfherder';
import configuration from '../configuration';

const PlotSuite = ({ match }) => (
  <div>
    <PerfherderContainer
      {...match.params}
      {...configuration[match.params.suite]}
    />
  </div>
);

PlotSuite.propTypes = {
  match: propTypes.shape({}).isRequired,
};

export default PlotSuite;
