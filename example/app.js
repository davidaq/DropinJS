Dropin.declare('app', function* (require) {
  const { Component } = yield require('react');
  const { render } = yield require('react-dom');
  const jsx = yield require('t7-react');

  class App extends Component {
    constructor(props) {
      super(props);
      this.handleClick = this.handleClick.bind(this);
      this.state = {
        clicks: 0,
      };
    }

    handleClick() {
      this.setState({ clicks: this.state.clicks + 1 });
    }

    render() {
      return jsx`
        <div>
          <h1>React + JSX still works without compiling!</h1>
          <button onClick=${this.handleClick}>Click Me</button>
          ${this.state.clicks > 0 ? jsx`
            <div>
              Clicking works just as it should be.
              You clicked ${this.state.clicks} times.
            </div>
          ` : null}
        </div>
      `;
    }
  };
  return App;
});

