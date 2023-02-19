import { REACT_FRABMENT, REACT_FORWARD_REF, REACT_TEXT, PLACEMENT, MOVE, REACT_PROVIDER, REACT_CONTEXT, REACT_MEMO } from "./constant";
import { changeVnode } from './react';
import addEvent from './addEvent.js';

import { updateQueue, shouldUpdate } from './component';


let hookStates = [];

let hookIndex = 0;

let scheduleUpdate;

export function useState(initialState) {
  return useReducer(null, initialState);
}


export function useReducer(reducer, initialState) {
  hookStates[hookIndex] = hookStates[hookIndex] || initialState;
  let currentIndex = hookIndex;
  function dispatch(action) {
    //1.获取老状态
    let oldState = hookStates[currentIndex];
    //如果有reducer就使用reducer计算新状态
    if (reducer) {
      let newState = reducer(oldState, action);
      hookStates[currentIndex] = newState;
    } else {
      //判断action是不是函数，如果是传入老状态，计算新状态
      let newState = typeof action === 'function' ? action(oldState) : action;
      hookStates[currentIndex] = newState;
    }
    scheduleUpdate();
  }
  return [hookStates[hookIndex++], dispatch];
}

export function useMemo(factory, deps) {
  if (hookStates[hookIndex]) {
    let [lastMemo, lastDeps] = hookStates[hookIndex];
    let same = deps.every((item, index) => item === lastDeps[index]);
    if (same) {
      hookIndex++;
      return lastMemo;
    } else {
      let newMemo = factory();
      hookStates[hookIndex++] = [newMemo, deps];
      return newMemo;
    }
  } else {
    let newMemo = factory();
    hookStates[hookIndex++] = [newMemo, deps];
    return newMemo;
  }
}

export function useCallback(callback, deps) {
  if (hookStates[hookIndex]) {
    let [lastCallback, lastDeps] = hookStates[hookIndex];
    let same = deps.every((item, index) => item === lastDeps[index]);
    if (same) {
      hookIndex++;
      return lastCallback;
    } else {
      hookStates[hookIndex++] = [callback, deps];
      return callback;
    }
  } else {
    hookStates[hookIndex++] = [callback, deps];
    return callback;
  }
}


export function useEffect(callback, deps) {
  let currentIndex = hookIndex;
  if (hookStates[hookIndex]) {
    let [destroy, lastDeps] = hookStates[hookIndex];
    let same = deps && deps.every((item, index) => item === lastDeps[index]);
    if (same) {
      hookIndex++;
    } else {
      destroy && destroy();
      setTimeout(() => {
        hookStates[currentIndex] = [callback(), deps];
      });
      hookIndex++;
    }
  } else {
    setTimeout(() => {
      hookStates[currentIndex] = [callback(), deps];
    });

    hookIndex++;
  }
}


export function useLayoutEffect(callback,dependencies){
  let currentIndex = hookIndex;
  if(hookStates[hookIndex]){
    let [destroy,lastDeps] = hookStates[hookIndex];
    let same = dependencies&&dependencies.every((item,index)=>item === lastDeps[index]);
    if(same){
      hookIndex++;
    }else{
      destroy&&destroy();
      hookStates[currentIndex]=[callback(),dependencies];
      hookIndex++;
    }
  }else{
    hookStates[currentIndex]=[callback(),dependencies];
    hookIndex++;
  }
}

export function useRef(initialState) {
  hookStates[hookIndex] =  hookStates[hookIndex] || { current: initialState };
  return hookStates[hookIndex++];
}

export function useImperativeHandle(ref, factory) {
  return ref.current = factory();
}


export function useContext(context) {
  return context._currentValue;
}





function render(vnode, target, protal) {
  // 如果是非createProtal（表示render），清除目标dom的内容
  if (!protal) {
    target.innerHTML = '';
  }
  mount(vnode, target);

  scheduleUpdate = () => {
    hookIndex = 0;
    twoVnode(target, vnode, vnode);
  };
}

function mount(vnode, target) {
  const dom = createDom(vnode);
  target.appendChild(dom);

  // 组件完成挂载的时候执行
  if (dom.componentDidMount) {
    updateQueue.isBatchData = true;
    dom.componentDidMount();
    updateQueue.batchUpdate();
  }
}

function createDom(vnode) {

  // 将数字和字符串转化为对象描述的元素
  vnode = changeVnode(vnode);

  const { type, props, ref } = vnode;

  // mome组件
  if (type && type.$$typeof === REACT_MEMO) {
    return mountMemoComponent(vnode);
  }

  // Provider组件
  if (type.$$typeof === REACT_PROVIDER) {
    return mountProviderComponent(vnode);
  }

  // Consumer组件
  if (type.$$typeof === REACT_CONTEXT) {
    return mountContextComponent(vnode);
  }


  // class实例上由父类的静态属性，说明是继承自React.Component
  if (type.isClassComponent) {
    return mountClassComponent(vnode);
  }

  // 函数组件
  if (typeof type === 'function') {
    return mountFunctionComponent(vnode);
  }

  // forward组件
  if (type && type.$$typeof === REACT_FORWARD_REF) {
    return mountForwardComponent(vnode);
  }

  let dom;

  if (vnode.type === REACT_TEXT) {
    // 普通文本
    dom = document.createTextNode(vnode.content);
  } else if (type === REACT_FRABMENT) {
    // 空白元素
    dom = document.createDocumentFragment();
  } else {
    // 普通元素
    dom = document.createElement(type);
  }

  updateProps(dom, {}, props);
  changeChildren(props.children, dom);

  // 到了这里的vnode,都只是普通的原生组件。
  // 因为FunctionComponent合ClassComponent的vnode已经被它们各自的函数消费了
  vnode.dom = dom; //保存真实dom

  // 原生组件，如果有ref，那就把dom赋值给它
  if (ref) ref.current = dom;
  return dom;
}


function mountMemoComponent(vnode) {
  let { type, props } = vnode;
  let renderVnode = type.type(props);

  // 设置旧的props
  vnode.prevProps = props;
  // 给vnode也挂载oldVnode
  vnode.oldReaderVnode = renderVnode;
  // 通过原生组件生成真实dom
  const dom = createDom(renderVnode);
  return dom;
}

function mountProviderComponent(vdom) {
  let { type, props } = vdom;
  // type上有个_context属性，指会context本身(context就是全局对象)
  let context = type._context;
  // context的_currentValue属性设置传递的值（通过value传递）
  context._currentValue = props.value;
  let renderVdom = props.children;
  // 设置oldReaderVnode，方便后续通过这个找到真实dom
  vdom.oldReaderVnode = renderVdom;
  return createDom(renderVdom);
}

function mountContextComponent(vdom) {
  let { type, props } = vdom;
  let context = type._context;
  let renderVdom = props.children(context._currentValue);
  // 设置oldReaderVnode，方便后续通过这个找到真实dom
  vdom.oldReaderVnode = renderVdom;
  return createDom(renderVdom);
}

function mountForwardComponent(vnode) {
  const { type, props, ref } = vnode;
  const functionVnode = type.render(props, ref);
  return createDom(functionVnode);
}

function updateProps(dom, oldProps, newProps) {
  const { style, ...other } = newProps;
  if (style) {
    Object.keys(style).forEach(key => {
      dom.style[key] = style[key];
    });
  }
  Object.keys(other).forEach(key => {
    if (key === 'children') return;
    if (key.startsWith('on')) {
      // 设置合成事件
      addEvent(dom, key.toLocaleLowerCase(), other[key]);
    } else {
      dom[key] = other[key];
    }
  });
  Object.keys(oldProps).forEach(key => {
    if (key === 'children') return;
    if (!newProps[key]) {
      dom[key] = null;
    }
  });
}

// 处理children
function changeChildren(children, target) {
  if (Array.isArray(children)) {
    children = children.flat(Infinity);
    children.forEach(child => mount(child, target));
  } else if (children !== undefined && children !== null) {
    mount(children, target);
  }
}


//处理类组件
function mountClassComponent(vnode) {

  // 此时的vnode是类组件的vnode,type是class构造函数
  const { type, props, ref } = vnode;

  // type是class类，new获取它的实例
  const instance = new type(props);

  if (type.contextType) {
    // contextType就是全局对象（context）
    instance.context = type.contextType._currentValue;
  }
  // 静态属性getDerivedStateFromProps的作用是在渲染前，传入它的props和state，函数的返回值会合并到this.state
  if (instance.constructor.getDerivedStateFromProps) {
    let newState = instance.constructor.getDerivedStateFromProps(instance.props, instance.state);
    if (newState) {
      instance.state = { ...instance.state, ...newState };
    }
  }

  // class组件，给ref添加实例
  if (ref) ref.current = instance;

  // 获取到class组件的原生组件
  const classVnode = instance.render();

  // 实例挂载它自身的原生组件，命名为oldReaderVnode
  instance.oldReaderVnode = classVnode;
  // 给类组件的vnode挂载它自身的原生组件，命名为oldReaderVnode
  vnode.oldReaderVnode = classVnode;
  // 给类组件的vnode挂载它自身的实例，命名为classInstance
  vnode.classInstance = instance;


  // 判断如果有componentWillMount,在完成createDom之前执行
  if (instance.componentWillMount) {
    instance.componentWillMount();
  }

  // 通过原生组件生成真实dom
  const dom = createDom(classVnode);
  if (instance.componentDidMount) {
    dom.componentDidMount = instance.componentDidMount.bind(instance);
  }

  return dom;
}

//处理函数式组件
function mountFunctionComponent(vnode) {
  // 此时的vnode是数式组件的vnode
  const { type, props } = vnode;
  const functionVnode = type(props);
  // 给vnode也挂载oldVnode
  vnode.oldReaderVnode = functionVnode;

  // 通过原生组件生成真实dom
  const dom = createDom(functionVnode);
  return dom;
}

function twoVnode(parentDom, oldVnode, newVnode, nextDom) {
  // 这时候调用createDom生成新的真实dom,同时createDom函数会将真实的dom，挂载到newVnode上。
  // const newDom = createDom(newVnode);
  // parentDom.replaceChild(newDom, findDOM(oldVnode));
  // return;
  if (!oldVnode && !newVnode) return;
  // 如果老的有，新的没有，直接删除
  if (oldVnode && !newVnode) {
    unMountVnode(oldVnode);//删除老的
    return;
  }

  // 如果老的没有，新的有。直接添加
  if (!oldVnode && newVnode) {
    let newDom = createDom(newVnode);
    if (nextDom) { // 判断有没有需要插入的位置
      parentDom.insertBefore(newDom, nextDom);
    } else {
      parentDom.appendChild(newDom);
    }
    // 组件完成挂载的时候执行
    if (newDom.componentDidMount) newDom.componentDidMount();
    return;
  }

  // 这里表示两个都有 =》 判断两个类型type，如果类型一样，可以复用。类型不一样，不能复用
  if (oldVnode && newVnode && oldVnode.type !== newVnode.type) {
    mountVdom(parentDom, newVnode, nextDom);
    // old: div   new: span
    unMountVnode(oldVnode);

    return;
  }

  updateElement(oldVnode, newVnode);
}

function updateElement(oldVnode, newVnode) {

  // 文本节点
  if (oldVnode.type === REACT_TEXT && newVnode.type === REACT_TEXT) {
    // 复用老的文本节点
    let currentDom = newVnode.dom = findDOM(oldVnode);
    // 如果文本相同，那就不更新了
    if (oldVnode.content === newVnode.content) return;
    // 获取最新的文本内容
    currentDom.textContent = newVnode.content;
    return;
  }

  // 原生组件
  if (typeof oldVnode.type === 'string' || oldVnode.type === REACT_FRABMENT) {
    // 复用老的dom节点
    let currentDom = newVnode.dom = findDOM(oldVnode);
    // 更新属性
    updateProps(currentDom, oldVnode.props, newVnode.props);
    // 更新children
    updateChildren(currentDom, oldVnode.props.children, newVnode.props.children);
    return;
  }

  // 类组件
  if (typeof oldVnode.type === 'function' && oldVnode.type.isClassComponent) {
    // 更新类组件
    updateClassComponent(oldVnode, newVnode);
    return;
  }

  // Provider组件
  if (oldVnode.type.$$typeof === REACT_PROVIDER) {
    // 更新Provider组件
    updateProviderComponent(oldVnode, newVnode);
    return;
  }

  // Consumer组件
  if (oldVnode.type.$$typeof === REACT_CONTEXT) {
    // 更新Consumer组件
    updateConsumerComponent(oldVnode, newVnode);
    return;
  }

  // React.memo组件
  if (oldVnode.type.$$typeof === REACT_MEMO) {
    // 更新React.memo组件
    updateMemoComponent(oldVnode, newVnode);
    return;
  }

  // 剩下的就是函数组件=>更新函数组件
  updateFunctionComponent(oldVnode, newVnode);
}

// 更新React.memo组件
function updateMemoComponent(oldVnode, newVnode) {
  let { type, prevProps } = oldVnode;
  let renderVdom = oldVnode.oldReaderVnode;
  if (!type.compare(prevProps, newVnode.props)) {
    let currentDOM = findDOM(oldVnode);
    let parentDOM = currentDOM.parentNode;
    let { type, props } = newVnode;
    renderVdom = type.type(props);
    twoVnode(parentDOM, oldVnode.oldReaderVnode, renderVdom);
  }
  newVnode.prevProps = newVnode.props;
  newVnode.oldReaderVnode = renderVdom;
}

// 更新Provider组件
function updateProviderComponent(oldVnode, newVnode) {
  let parentDOM = findDOM(oldVnode).parentNode;
  let { type, props } = newVnode;
  let context = type._context;
  // 这里主要是给context的_currentValue属性，更新value
  context._currentValue = props.value;
  let renderVdom = props.children;
  // 数值更新之后，获取老的vnode和新的vnode，调用twoVnode替换
  twoVnode(parentDOM, oldVnode.oldReaderVnode, renderVdom);
  newVnode.oldReaderVnode = renderVdom;
}

// 更新Consumer组件
function updateConsumerComponent(oldVnode, newVnode) {
  let parentDOM = findDOM(oldVnode).parentNode;
  let { type, props } = newVnode;
  let context = type._context;
  // 传入最新的_currentValue
  let renderVdom = props.children(context._currentValue);
  twoVnode(parentDOM, oldVnode.oldReaderVnode, renderVdom);
  newVnode.oldReaderVnode = renderVdom;
}

function updateChildren(parentDom, oldChildren, newChildren) {
  oldChildren = Array.isArray(oldChildren) ? oldChildren.flat(Infinity) : [oldChildren].filter(i => i);
  newChildren = Array.isArray(newChildren) ? newChildren.flat(Infinity) : [newChildren].filter(i => i);

  //1构建一个老的map结构  key就收虚拟dom的可以，值就是虚拟dom
  let keyedOldMap = {};
  oldChildren.forEach((oldVchlid, index) => {
    //有没有key
    let oldKey = oldVchlid?.key ? oldVchlid?.key : index;
    oldVchlid.mountIndex = index;
    keyedOldMap[oldKey] = oldVchlid;
  });
  //2遍历新的去老的中查找，进行更新 ，注意 （1）有移动

  //需要操作的数据的数据
  let patch = [];

  let lastPlaceIndex = 0;

  newChildren.forEach((newVchild, index) => {
    newVchild.mountIndex = index;
    //按照key值去找
    let newKey = newVchild.key ? newVchild.key : index;

    let oldVchlid = keyedOldMap[newKey];

    //就有几种情况
    if (oldVchlid) { //有
      //递归元素
      twoVnode(findDOM(oldVchlid).parentNode, oldVchlid, newVchild, findDOM(oldVchlid));

      //判断一下是否移动  lastPlaceIndex
      if (oldVchlid.mountIndex < lastPlaceIndex) { //移动
        patch.push({
          type: MOVE,
          oldVchlid,
          newVchild,
          mountIndex: index //把oldVchild移动到当前的索引处
        });
      }
      //从map中删除掉
      delete keyedOldMap[newKey];
      //比对一下lastPlaceIndex 值
      lastPlaceIndex = Math.max(oldVchlid.mountIndex, newVchild.mountIndex);

    } else { //没有找到 =》插入
      patch.push({
        type: PLACEMENT,
        newVchild,
        mountIndex: index
      });
    }
  });

  // 获取需要移动的元素
  let moveChilren = patch.filter(action => action.type == MOVE).map(action => action.oldVchlid);

  const list = Object.values(keyedOldMap).concat(moveChilren);
  //遍历完成后再map留下的元素就是没有被复用的元素，需要删除
  list.forEach(oldChildren => {
    let currentDOM = findDOM(oldChildren);
    parentDom.removeChild(currentDOM);
  });

  //插入
  patch.forEach(action => {
    let { type, oldVchlid, newVchild, mountIndex } = action;
    //获取到真实的Dom节点的集合
    let childNodes = parentDom.childNodes;
    if (type === PLACEMENT) {
      let newDOM = createDom(newVchild);//根据新的虚拟dom创建真实dom
      let childNode = childNodes[mountIndex]; //获取原来老的dom中对应的索引的真实dom
      if (childNode) {
        parentDom.insertBefore(newDOM, childNode);
      } else {//后添加
        parentDom.appendChild(newDOM);
      }
    } else if (type == MOVE) {
      let oldDOM = findDOM(oldVchlid);
      //再到集合中找到对应的位置，把它删除
      let childNode = childNodes[mountIndex]; //获取原来老的dom中对应的索引的真实dom
      if (childNode) {
        parentDom.insertBefore(oldDOM, childNode);
      } else {
        parentDom.appendChild(oldDOM);
      }
    }
  });
}


//更新函数组件
function updateFunctionComponent(oldVnode, newVnode) {

  let parentDom = findDOM(oldVnode).parentNode;// 获取老的真实dom的父节点
  let { type, props } = newVnode;
  let newRenderVdom = type(props); //获取到新的组件的vnode
  twoVnode(parentDom, oldVnode.oldReaderVnode, newRenderVdom);
  // 设置oldReaderVnode，为了后续能拿到真实dom（此时的newRenderVdom经过twoVnode函数，newRenderVdom已经被赋予了真实dom）
  newVnode.oldReaderVnode = newRenderVdom;
}

// 更新类组件
function updateClassComponent(oldVnode, newVnode) {
  // 复用老的实例
  let classInstance = newVnode.classInstance = oldVnode.classInstance;
  // 复用老的vnode，为了后续能拿到真实dom
  newVnode.oldReaderVnode = oldVnode.oldReaderVnode;
  // 注意在这里需要判断一下 是否需要 就收更新组件的数据
  if (classInstance.componentWillReceiveProps) {
    classInstance.componentWillReceiveProps(newVnode.props);
  }

  // 判断纯组件是否需要更新
  if (classInstance.shouldPureComponentUpdate && !classInstance.shouldPureComponentUpdate(newVnode.props, oldVnode.props)) return;


  // 更新props =>  类组件强制更新
  classInstance.props = newVnode.props;
  shouldUpdate(classInstance, classInstance.state);
}

// dom挂载
function mountVdom(parentDom, newVnode, nextDom) {

  let newDom = createDom(newVnode);

  if (nextDom) { // 判断有没有需要插入的位置
    parentDom.insertBefore(newDom, nextDom);
  } else {
    parentDom.appendChild(newDom);
  }
  // 组件完成挂载的时候执行
  if (newDom.componentDidMount) newDom.componentDidMount();
}

// 卸载dom
function unMountVnode(oldVnode) {
  let { props, ref } = oldVnode;
  let currentDOM = findDOM(oldVnode);

  // 如果是class实例，那么执行它的componentWillUnmount方法
  if (oldVnode.type?.isClassComponent) {
    const classInstance = new oldVnode.type(props);
    classInstance.componentWillUnmount && classInstance.componentWillUnmount();
  }

  // 如果之前是有挂载ref的（class组件时挂载自身的实例），那么清空该ref
  if (ref) {
    ref.current = null;
  }

  // 如果时class/function组件，就通过oldReaderVnode获取原生组件的vnode
  if (oldVnode.oldReaderVnode?.props?.children) {
    let children = oldVnode.oldReaderVnode?.props?.children;
    children = Array.isArray(children) ? children : [children].filter(i => i);
    // 递归
    children.forEach(unMountVnode);
  }


  if (props?.children) {
    let children = Array.isArray(props.children) ? props.children : [props.children];
    // 递归
    children.forEach(unMountVnode);
  }

  // 删除元素
  if (currentDOM) {
    currentDOM.remove();
  }
}

function findDOM(vnode) {
  if (!vnode) return null;
  //说明这个vnode是一个原生组件的虚拟dom，他会有dom属性指向真实的dom
  if (vnode.dom) return vnode.dom;
  //如果vnode没有dom属性，那说明这个vnode是一个class或者function的vnode，它会有oldReaderVnode，指向它内部获取到的原生组件的虚拟dom
  return findDOM(vnode.oldReaderVnode);
}

function createPortal(vnode, target) {
  mount(vnode, target);
}

export {
  twoVnode,
  findDOM
};

const ReactDOM = {
  render,
  createPortal
};

export default ReactDOM;
