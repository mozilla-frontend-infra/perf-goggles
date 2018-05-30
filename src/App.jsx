import { Component } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import ListSuites from './components/list_suites';


export default class App extends Component {
  state = {
    hasError: undefined,
    configuration: {
      linux64: ['ARES6', 'JetStream', 'motionmark_htmlsuite', 'motionmark_animometer'],
    },
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true });
    // eslint-disable-next-line no-console
    console.log(error, info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }

    const { configuration } = this.state;

    return (
      <div>
        <Link to="/" href="/">Home</Link>
        <ListSuites configuration={configuration} />
      </div>
    );
  }
}
