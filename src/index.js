// import React, { useState } from 'react';
// import ReactDOM from 'react-dom';

import React, { useState } from '../react/react.js';
import ReactDOM from '../react/react-dom';
import Child from './components/Child.js';


export let StateDate = React.createContext();


const Child2 = () => {
  return (
    <div>
      <StateDate.Consumer>
        {num => <h1>{num}</h1>}
      </StateDate.Consumer>
    </div>
  );
};

function App() {
  let [num, setNum] = useState(0);
  //根组件提供数据
  return (
    <div>
      <h1 onClick={() => setNum(num++)}>父亲</h1>
      <StateDate.Provider value={num}>
        <Child></Child>
      </StateDate.Provider>
      <Child2></Child2>
    </div>


  );
}


ReactDOM.render(<App />, document.getElementById('app'));