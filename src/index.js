/* eslint-disable react/no-deprecated */

import React from 'react';
import ReactDOM from 'react-dom';

// import React, { useState } from '../react/react.js';
// import ReactDOM from '../react/react-dom';

// import React from "../toy-react";
// const ReactDOM = React;

const A = ({ count }) => {
  React.useLayoutEffect(() => {
    console.log('useLayoutEffect');
    return () => {
      console.log('useLayoutEffect,1111');
    };
  }, []);

  React.useEffect(() => {
    console.log('useEffect');
    return () => {
      console.log('useEffect,1111');
    };
  }, []);

  return (
    <div>
      {count}
    </div>
  );
};

const App = () => {
  const [count, setCount] = React.useState(1);
  const [count2, setCount2] = React.useState(2);

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
        count % 2 === 0 ? <A count={count} /> : null
      }
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
