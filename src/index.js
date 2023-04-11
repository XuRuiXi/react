/* eslint-disable react/no-deprecated */


// import React, { useState } from 'react';
// import ReactDOM from 'react-dom';

// import React, { useState } from '../react/react.js';
// import ReactDOM from '../react/react-dom';

import React from '../toy-react';

const App = () => {
  const [count, setCount] = React.useState(1);
  const [count2, setCount2] = React.useState(2);
  return (
    <div>
      <h1>hello {count}</h1>
      <button onClick={() => setCount(count + 1)}>add</button>
      <h1>hello {count2}</h1>
      <button onClick={() => setCount2(count2 + 1)}>add</button>
    </div>
  );
};

React.render(<App />, document.getElementById('app'));