import React, { Component } from 'react';
export default class Test extends Component {
  render() {
    return (
      <App />
    )
  }
}


// Context lets us pass a value deep into the component tree
// without explicitly threading it through every component.
// Create a context for the current theme (with "light" as the default).
const ThemeContext = React.createContext('yellow');
class App extends React.Component {
  render() {
    // Use a Provider to pass the current theme to the tree below.
    // Any component can read it, no matter how deep it is.
    // In this example, we're passing "dark" as the current value.
    return (
      <ThemeContext.Provider value="blue">
        <TestElement2 />
      </ThemeContext.Provider>
    );
  }
}

class TestElement2 extends React.Component {
  // Assign a contextType to read the current theme context.
  // React will find the closest theme Provider above and use its value.
  // In this example, the current theme is "dark".
  static contextType = ThemeContext;
  constructor(props) {
    super(props);
  }
  render() {

    console.log(this.contextType);
    return (
      <p>TestElement2</p>
    );
  }
}
