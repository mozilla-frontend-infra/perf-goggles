import propTypes from 'prop-types';
import { Link } from 'react-router-dom';

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
  </div>
);

ListSuites.propTypes = {
  configuration: propTypes.shape({}).isRequired,
};

export default ListSuites;
