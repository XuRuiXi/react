import { updateQueue } from "./component";

/**
 * 利用事件委托，把所有事件放在document上处理
 * @param {*} dom 产生事件的dom
 * @param {*} eventType 事件类型
 * @param {*} handler 事件函数
 */

export default function addEvent(dom, eventType, handler) {
  const store = dom.store || (dom.store = {});
  store[eventType] = handler;
  document[eventType] = dispatchEvent;
}


function dispatchEvent(e) {
  const { type, target } = e;
  const eventType = `on${type}`;
  const { store } = target;

  const handler = store && store[eventType];
  const event = createBaseEvent(e);
  // 生成合成事件
  updateQueue.isBatchData = true;
  handler && handler(event);
  updateQueue.batchUpdate();
}

function createBaseEvent(nativeEvent) {
  let syntheticBaseEvent = {};
  for (let key in nativeEvent) {
    syntheticBaseEvent[key] = nativeEvent[key];
  }
  syntheticBaseEvent.nativeEvent = nativeEvent;
  syntheticBaseEvent.preventDefault = preventDefault;
  return syntheticBaseEvent;
}

function preventDefault(e) {
  // ie
  if (!e) {
    window.event.returnValue = false;
  }
  if (e.preventDefault) {
    e.preventDefault();
  }
}