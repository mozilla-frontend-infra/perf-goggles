import { Component } from 'react';
import propTypes from 'prop-types';
import Graph from '../components/graph';
import subbenchmarks from '../utils/perfherder';

export default class PerfherderContainer extends Component {
  state = {
    data: undefined,
  }

  async componentDidMount() {
    const { perfherderUrl, data } = await subbenchmarks({
      platform: this.props.platform,
      suite: this.props.suite,
    });
    // eslint-disable-next-line
    this.setState({ perfherderUrl, data });
  }

  async componentDidUpdate(prevProps) {
    // The component has been called with new props and we
    // need to update the state or the old state will be used
    if (this.props.suite !== prevProps.suite) {
      const { perfherderUrl, data } = await subbenchmarks({
        platform: this.props.platform,
        suite: this.props.suite,
      });
      // eslint-disable-next-line
      this.setState({ perfherderUrl, data });
    }
  }

  render() {
    const { perfherderUrl, data } = this.state;

    const sortAlphabetically = (a, b) => {
      if (a.meta.test < b.meta.test) return -1;
      if (a.meta.test > b.meta.test) return 1;
      return 0;
    };

    return (
      <div>
        {data && (
          <div>
            <a href={perfherderUrl} target="_blank">{this.props.suite} (all subtests)</a>
            <div>NOTE: When switching benchmarks you will notice the graphs will take
              long to redraw.
            </div>
            {Object.values(data).sort(sortAlphabetically).map(el => (
              <div key={el.meta.test} style={{ textAlign: 'center' }}>
                <a href={el.meta.url} target="_blank">{el.meta.test}</a>
                <Graph
                  key={el.meta.test}
                  {...el}
                  graphOptions={{
                    x_accessor: 'datetime',
                    y_accessor: 'value',
                    min_y_from_data: true,
                    full_width: true,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

PerfherderContainer.propTypes = {
  platform: propTypes.string.isRequired,
  suite: propTypes.string.isRequired,
};
