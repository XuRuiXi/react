/* eslint-disable react/no-deprecated */

import React from 'react';
import ReactDOM from 'react-dom';

// import React, { useState } from '../react/react.js';
// import ReactDOM from '../react/react-dom';

// import React from "../toy-react";
// const ReactDOM = React;

const A = ({ count }) => {
  React.useLayoutEffect(() => {
    console.log('useLayoutEffect,AAAA');
    return () => {
      console.log('销毁useLayoutEffectt,AAAA');
    };
  }, []);

  React.useEffect(() => {
    console.log('useEffect,AAAA');
    return () => {
      console.log('销毁useEffect,AAAA');
    };
  }, []);

  return (
    <div>
      {count}
    </div>
  );
};

class B extends React.Component {
  componentDidMount() {
    console.log('componentDidMount,BBBB');
  }

  componentWillUnmount() {
    console.log('componentWillUnmount,BBBB');
  }

  getNumber() {
    console.log(1111111);
  }

  render() {
    return (
      <div>
        classCop
      </div>
    );
  }
}

const App = () => {
  const [count, setCount] = React.useState(1);
  const [count2, setCount2] = React.useState(2);

  React.useLayoutEffect(() => {
    console.log('useLayoutEffect');
    return () => {
      console.log('销毁useLayoutEffectt');
    };
  }, []);
  console.log(B.prototype.getNumber());
  return (
    <div>
      <h1>hello {count}</h1>
      <button
        onClick={() => {
          setCount((a) => a + 1);
        }}
      >
        add
      </button>
      <h1>hello {count2}</h1>
      <button
        onClick={() => {
          setCount2(count2 + 1);
        }}
      >
        add
      </button>
      {
        count % 2 === 0 ?
          <>
            <A count={count} />
            <B />
          </> :
          <A count={count} />
      }
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
