let workInProgressHook;
let isMount = true;

const fiber = {
  memoizedState: null,
  stateNode: App
};

// schedule表示调度函数，用于调度更新。
function schedule() {
  // 让指针指向第一个 hook
  workInProgressHook = fiber.memoizedState;
  const app = fiber.stateNode();
  isMount = false;
  return app;
}

function dispatchAction(queue, action) {
  // queue更新队列形成一个单向循环链表
  const update = {
    action,
    next: null
  };
  // 首次更新，让update.next指向自己（形成一个单向循环链表）
  if (queue.pending === null) {
    update.next = update;
  } else {
    // 非首次更新，将update插入到队列的最后
    // u1 => u2 => u3 => u1
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;

  schedule();
}

function useState(initialState) {
  let hook;

  /**
   * 第一次渲染，创建 hook 链表
   * 1. 创建 hook 对象
   * 2. 将 hook 对象挂载到 fiber.memoizedState 上
   * 每个 hook 对象主要有以下属性
   * 1）queue: 用于存放更新的队列
   * 2）memoizedState: 用于存放当前 hook 的状态
   * 3）next: 用于指向下一个 hook
  */
  if (isMount) {
    hook = {
      queue: {
        pending: null
      },
      memoizedState: initialState,
      next: null
    };
    /**
     * fiber.memoizedState不存在则说明是第一个 hook，将 hook 对象挂载到 fiber.memoizedState 上
     */
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
    } else {
      // 如果存在，则将hook对象挂载到当前指针指向的hook对象的next属性上
      workInProgressHook.next = hook;
    }
    // 指针指向下一个 hook
    workInProgressHook = hook;
  } else {
    // 更新阶段
    // 取到当前指针指向的hook对象
    hook = workInProgressHook;
    // 指针指向下一个 hook
    workInProgressHook = workInProgressHook.next;
  }

  // baseState表示当前hook的状态
  let baseState = hook.memoizedState;
  // 如果有更新，则遍历更新队列，将更新的状态赋值给baseState
  if (hook.queue.pending) {
    // 取到更新队列的第一个更新
    let firstUpdate = hook.queue.pending.next;
    do {
      // 取到更新的action
      const action = firstUpdate.action;
      // 将更新后的状态赋值给baseState
      baseState = action(baseState);
      // 指向下一个更新
      firstUpdate = firstUpdate.next;
      // 如果firstUpdate指向的是更新队列的第一个更新，则说明遍历完了更新队列
    } while (firstUpdate !== hook.queue.pending);

    hook.queue.pending = null;
  }
  // 将更新后的状态赋值给hook.memoizedState
  hook.memoizedState = baseState;
  // dispatchAction函数传入hook.queue队列，用于更新状态
  return [baseState, dispatchAction.bind(null, hook.queue)];
}

function App() {
  const [num, updateNum] = useState(1);
  const [num1, updateNum1] = useState(2);
  const [num2, updateNum2] = useState(3);
  const [num3, updateNum3] = useState(4);

  console.log(`${isMount ? 'mount' : 'update'} num: `, num);

  return {
    click() {
      updateNum(num => num + 1);
    }
  };
}

window.app = schedule();

console.log(fiber);
