import React, { useContext } from "../../react/react.js";
import { StateDate } from "../index";

function Child() {
  //子组价获取数据
  let num= useContext(StateDate); //返回最新的数据
  return (
    <div>
      <h1>{num}</h1>
    </div>

  );
}

export default Child;
