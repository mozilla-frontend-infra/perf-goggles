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
        <ul>
          {configuration[platform].map(suite => (
            <li key={suite}>
              <Link
                to={`/${platform}/${suite}`}
                href={`/${platform}/${suite}`}
              >
                {suite}
              </Link>
            </li>
          ))}
        </ul>
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
