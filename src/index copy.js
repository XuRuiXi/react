// import React from 'react';
// import ReactDOM from 'react-dom';

// import React from '../react/react.js';
// import ReactDOM from '../react/react-dom';

import React from '../lib/react.js';
import ReactDOM from '../lib/react-dom';

class Counter3 extends React.Component {
  constructor(props) {
    super(props);
  }
  componentWillUnmount() {
    console.log('componentWillUnmount--------Counter3');
  }

  render() {
    return (
      <div>
        Counter3
      </div>
    );
  }
}


class Counter2 extends React.Component {
  constructor(props) {
    super(props);
  }
  componentWillUnmount() {
    console.log('componentWillUnmount--------Counter2');
  }

  render() {
    return (
      <div>
        <Counter3 />
        Counter2
      </div>
    );
  }
}


class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      list: ['A', 'B', 'C'],
      number: 0
    };
  }
  // eslint-disable-next-line react/no-deprecated
  componentWillReceiveProps(p) {
    console.log(p);
  }
  componentWillUnmount() {
    console.log('componentWillUnmount-------Counter');
  }

  componentDidMount() {
    console.log();
  }

  handleClick = () => {
    this.setState({
      list: ['A', 'C', 'B'],
      number: this.state.number + 1
    });
  };
  render() {
    return (
      <div>
        <div>{this.state.number}</div>
        {
          this.state.list.map(item => <div key={item}>{item}</div>)
        }
        <button onClick={this.handleClick}>+</button>
      </div>
    );
  }
}

function Aaa(props) {
  return (
    <div>{props.value}</div>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      number: 2
    };
  }

  add = () => {
    this.setState({
      number: this.state.number + 1
    });
  };

  render() {
    return (
      <div>
        <Aaa value={this.state.number} />
        <button onClick={this.add}>+</button>
        {/* { this.state.number % 2 === 0 ? <Counter add={this.add} /> : null } */}
        {
          new Array(this.state.number).fill(111).map((i, index) => <div key={`${index}444`}>{index}</div>)
        }
        {/* {
          new Array(this.state.number).fill(111).map((i, index) => <div key={`${index}3`}>0000000</div>)
        } */}
      </div>
    );
  }
}


ReactDOM.render(<Counter />, document.getElementById('app'));