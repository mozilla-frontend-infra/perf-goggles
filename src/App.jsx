import { Component } from 'react';
import './App.css';
import PerfherderContainer from './containers/perfherder';


export default class App extends Component {
  state = {
    hasError: undefined,
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true });
    console.log(error, info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }
    return (
      <div className="App">
        <PerfherderContainer
          suite="ARES6"
          platform="linux64"
        />
      </div>
    );
  }
}
