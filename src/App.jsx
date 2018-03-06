import { Component } from 'react';
import './App.css';
import Graph from './components/graph';
import subbenchmarks from './utils/perfherder';

export default class App extends Component {
  state = {
    data: undefined,
  }

  async componentDidMount() {
    const { perfherderUrl, data } = await subbenchmarks({
      suite: 'ARES6',
      platform: 'linux64',
    });
    // eslint-disable-next-line
    this.setState({ perfherderUrl, data });
  }

  render() {
    const { perfherderUrl, data } = this.state;

    return (
      <div className="App">
        <a href={perfherderUrl} target="_blank">ARES6 (all subtests)</a>
        {data && (
          <div>
            {Object.values(data).map(el => (
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
