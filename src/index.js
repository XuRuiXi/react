// import React, { useState, useEffect } from 'react';
// import ReactDOM from 'react-dom';

import React, { useState, useContext } from '../react/react.js';
import ReactDOM from '../react/react-dom';

let StateDate = React.createContext(); // {}

//2 在子组件中通过 React.useContext()
//实现useContext；全局变量
function Child() {
  //子组价获取数据
  let {num, setNum}= useContext(StateDate); //返回最新的数据
  return (
    <div>
      <h1>{num}</h1>
      <button onClick={() => {
        setNum(num+1);
      }}>点击</button>
    </div>

  );
}

function App() {
  let [num, setNum] = useState(0);
  //根组件提供数据
  return (
    <StateDate.Provider value={{ num, setNum }}>
      <div>
        <h1>父亲</h1>
        <Child></Child>

      </div>

    </StateDate.Provider>

  );
}


ReactDOM.render(<App />, document.getElementById('app'));