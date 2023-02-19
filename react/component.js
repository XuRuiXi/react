import { twoVnode, findDOM } from './react-dom';

export const updateQueue = {
  isBatchData: false, // 表示是否收集依赖之后再更新
  updaters: [],
  batchUpdate() {
    updateQueue.updaters.forEach(updater => updater.updateComponent());
    updateQueue.isBatchData = false;
    updateQueue.updaters.length = 0;
  }
};

class Updater {
  constructor(classInstance) {
    this.classInstance = classInstance;
    this.pendingState = [];
  }
  // 添加数据
  addState(partialData) {
    this.pendingState.push(partialData);
    // 更新数据
    this.emitUpdate();
  }
  emitUpdate() {
    if (updateQueue.isBatchData) { // 异步
      updateQueue.updaters.push(this);
    } else {
      // 更新组件
      this.updateComponent();
    }
  }
  // 更新组件
  updateComponent() {
    const { pendingState, classInstance } = this;
    // 获取数据 => 更新组件
    if (pendingState.length > 0) {
      shouldUpdate(classInstance, this.getState());
    }
  }
  getState() {
    const { pendingState, classInstance } = this;
    let { state } = classInstance;
    pendingState.forEach(nextState => {
      state = { ...state, ...nextState };
    });
    // 清空数据
    pendingState.length = 0;
    return state;
  }
}

function shouldUpdate(classInstance, newState) {

  let willUpdate = true;
  if (classInstance.shouldComponentUpdate) {
    willUpdate = classInstance.shouldComponentUpdate(classInstance.props, newState);
  }
  
  classInstance.state = newState;

  if (!willUpdate) return;

  classInstance.componentWillUpdate && classInstance.componentWillUpdate();
  
  classInstance.forceUpdate();
}


class Component {
  // 子类可以继承父类的实例方法、静态方法、原型方法
  static isClassComponent = true;
  constructor(props) {
    this.props = props;
    this.state = {};
    this.updater = new Updater(this);
  }
  setState(partialData) {
    this.updater.addState(partialData);
  }
  forceUpdate() {

    // 因为挂载发生在上一次的渲染阶段，而这次是forceUpdate。所有上次挂载的oldReaderVnode就属于旧的vnode（也就是它的render后的原生组件的vnode）
    const oldVnode = this.oldReaderVnode;
    // 因为我们给
    const oldDom = findDOM(oldVnode);

    // update阶段也需要重新给contextType赋值
    if (this.constructor.contextType) {
      this.context = this.constructor.contextType._currentValue;
    }
    
    // 静态属性getDerivedStateFromProps的作用是在渲染前，传入它的props和state，函数的返回值会合并到this.state
    if(this.constructor.getDerivedStateFromProps){
      let newState = this.constructor.getDerivedStateFromProps(this.props, this.state);
      if (newState) {
        this.state = {...this.state, ...newState};
      }
    }
    // getSnapshotBeforeUpdate会在渲染之前执行，所以此时能拿到渲染前的dom，它的返回值，会传入componentDidUpdate
    let snapshot = this.getSnapshotBeforeUpdate && this.getSnapshotBeforeUpdate();

    const newVnode = this.render();
    twoVnode(oldDom.parentNode, oldVnode, newVnode);

    // 渲染之后，oldReaderVnode（旧的vnode）就变成了newVnode；
    this.oldReaderVnode = newVnode;
 
    // 触发生命周期
    this.componentDidUpdate && this.componentDidUpdate(this.props, this.state, snapshot);
  }
}

export {
  Component,
  shouldUpdate
};