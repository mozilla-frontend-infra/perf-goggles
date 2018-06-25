import { Route, Link } from 'react-router-dom';
import propTypes from 'prop-types';
import PerfherderContainer from '../containers/perfherder';

const PlotSuite = ({ match }) => (
  <div>
    <PerfherderContainer
      suite={match.params.suite}
      platform={match.params.platform}
    />
  </div>
);

PlotSuite.propTypes = {
  match: propTypes.shape({}).isRequired,
};

const ListSuites = ({ configuration }) => (
  <div>
    {Object.keys(configuration).map(platform => (
      <div key={platform}>
        <span>{`Select a suite for "${platform}":`}</span>
        {configuration[platform].map(suite => (
          <span key={suite}>
            <Link
              to={`/${platform}/${suite}`}
              href={`/${platform}/${suite}`}
            >
              {suite}
            </Link>
            <span>&nbsp;</span>
          </span>
        ))}
      </div>
    ))}
    <hr />
    <Route path="/:platform/:suite" render={PlotSuite} />
  </div>
);

ListSuites.propTypes = {
  configuration: propTypes.shape({}).isRequired,
};

export default ListSuites;
