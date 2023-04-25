let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = null;
let wipFiber = null;
let hookIndex = null;


/* reconcileChildren
对于mount的组件，他会创建新的子Fiber节点
对于update的组件，他会将当前组件与该组件在上次更新时对应的Fiber节点比较（也就是俗称的Diff算法），将比较的结果生成新Fiber节点
*/
function reconcileChildren(wipFiber, elements) {
  // index表示当前处理的子元素的索引
  let index = 0;
  // oldFiber表示当前处理的子元素的旧fiber
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  // preSibling表示当前处理的子元素的前一个兄弟fiber
  let preSibling = null;

  while (index < elements.length || !!oldFiber) {
    const element = elements[index];
    let newFiber = null;

    // TODO compare oldFiber to element
    if (element && oldFiber && element.type === oldFiber.type) {
      // update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      };
    } else if (element && !oldFiber) {
      // add node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    } else if (!element && oldFiber) {
      // delete the oldFiber's node
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      preSibling.sibling = newFiber;
    }
    preSibling = newFiber;
    index++;
  }
}

export function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    action = typeof action === "function" ? action(hook.state) : action;
    hook.state = action;
  });

  const setState = action => {
    hook.queue.push(action);
    // 每次调用setState都会重新渲染整个组件，创建新的fiber树
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // create new fibers
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}

function updateFunctionComponent(fiber) {
  // wipfiber(work in progress fiber)表示正在工作的fiber
  wipFiber = fiber;
  // 在这里初始化hookIndex，创建hooks数组
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

// performUnitOfWork 执行任务单元，返回下一个任务单元
function performUnitOfWork(fiber) {
  // 判断fiber的类型
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  

  // return 下一个任务单元

  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

const isProperty = key => key !== "children";
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = next => key => !(key in next);
const isEvent = key => key.startsWith("on");

function updateDom(dom, prevProps, nextProps) {
  // remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        isGone(nextProps)(key) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2);
      dom.removeEventListener(
        eventType,
        prevProps[name]
      );
    });

  // remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach(name => {
      dom[name] = "";
    });

  // set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name];
    });
  // add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2);
      dom.addEventListener(
        eventType,
        nextProps[name]
      );
    });
}

function commitWorker(fiber) {
  if (!fiber) {
    return;
  }

  // const domParent = fiber.parent.dom;
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWorker(fiber.child);
  commitWorker(fiber.sibling);
}


function commitRoot() {
  // 渲染真实dom
  commitWorker(wipRoot.child);

  deletions.forEach(commitWorker);

  currentRoot = wipRoot;
  wipRoot = null;
}

// workLoop表示工作循环，它会不断的执行performUnitOfWork函数，直到nextUnitOfWork为null。
function workLoop(deadline) {
  // shouldYield表示是否需要让出控制权
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {

    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    );
    shouldYield = deadline.timeRemaining() < 1; 
  }
  
  // 真正渲染完成之后，nextUnitOfWork会变成null。
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);




function createDom(fiber) {
  const dom = fiber.type === "TEXT_ELEMENT" ?
    document.createTextNode("") :
    document.createElement(fiber.type);

  
  updateDom(dom, {}, fiber.props);

  return dom;
}



function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  };
  nextUnitOfWork = wipRoot;
  deletions = [];
}

export default render;

/*
  render阶段，创建fiber树。
  wipRoot是当前要渲染的根fiber
  nextUnitOfWork是当前下一个要执行的任务单元
  alternate是当前fiber的上一个fiber
*/