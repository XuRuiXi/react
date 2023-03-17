// import React, { useState } from 'react';
// import ReactDOM from 'react-dom';

import React, { useState } from '../react/react.js';
import ReactDOM from '../react/react-dom';
import Child from './components/Child.js';


export let StateDate = React.createContext();

function App() {
  let [num, setNum] = useState(0);
  //根组件提供数据
  return (
    <div>
      <h1 onClick={() => setNum(1)}>父亲</h1>
      <StateDate.Provider value={num}>
        <Child></Child>
      </StateDate.Provider>
    </div>


  );
}


ReactDOM.render(<App />, document.getElementById('app'));