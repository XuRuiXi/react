import { REACT_ELEMENT, REACT_FRABMENT, REACT_FORWARD_REF, REACT_TEXT, REACT_CONTEXT, REACT_PROVIDER, REACT_MEMO } from "./constant";
import { Component } from './component';
import { useState, useReducer, useMemo, useCallback, useEffect, useLayoutEffect, useRef, useImperativeHandle, useContext } from './react-dom';

// 把基本数据类型转换为对象形式，统一为text类型。方便后续对类型的判断。
// 基础数据类型，除了number、string、function，其他的内容统一设置为''(空)，这样在创建空白文本片段时，不会出现内容
// vnode可能为函数，是因为context.Consumner组件的children，会为函数（消费context）
export function changeVnode(vnode) {
  if (typeof vnode !== 'object' && typeof vnode !== 'function') {
    if (typeof vnode === 'string' || typeof vnode === 'number' ) {
      return {
        type: REACT_TEXT,
        content: vnode,
        props: {}
      };
    }
    return {
      type: REACT_TEXT,
      content: '',
      props: {}
    };
  }
  return vnode;
}

function createElement(type, config, ...children) {
  const { key = null, ref = null } = config || {};
  // 拿到key和ref之后，删除config上的属性
  key && Reflect.deleteProperty(config, 'key');
  ref && Reflect.deleteProperty(config, 'ref');

  const props = {
    ...config,
  };

  // 处理children
  if (children.length === 1) {
    props.children = changeVnode(children[0]);
  } else if (children.length > 1) {
    props.children = children.map(i => changeVnode(i));
  }
  
  return {
    $$typeof: REACT_ELEMENT,
    props,
    ref,
    key,
    type,
  };
}

function createRef() {
  return {
    current: null
  };
}

function forwardRef(render) {
  return {
    $$typeof: REACT_FORWARD_REF,
    render,
  };
}


function createContext() {
  let context = {
    $$typeof: REACT_CONTEXT,
    _currentValue: undefined
  };
  context.Provider = {
    $$typeof: REACT_PROVIDER,
    _context: context
  };
  context.Consumer = {
    $$typeof: REACT_CONTEXT,
    _context: context
  };
  return context;
}

// 如果存在新的children，则替换旧的
function cloneElement(element, newProps, ...newChildren) {
  let oldChildren = element.props && element.props.children;
  let children = newChildren.length ? newChildren : oldChildren;
  if (children.length === 1) children = changeVnode(children[0]);
  let props = { ...element.props, ...newProps, children };
  return { ...element, props };
}

function shallowEqual(o1,o2){
  var props1 = Object.getOwnPropertyNames(o1);
  var props2 = Object.getOwnPropertyNames(o2);
  if (props1.length !== props2.length) {
    return false;
  }
  for (var i = 0,max = props1.length; i < max; i++) {
    var propName = props1[i];
    if (o1[propName] !== o2[propName] && propName !== 'children') {
      return false;
    }
  }
  return true;
}

class PureComponent extends Component {
  shouldPureComponentUpdate(newProps = {}, oldProps = {}) {
    return !shallowEqual(oldProps, newProps);
  }
}

function memo(type, compare = shallowEqual) {
  return {
    $$typeof: REACT_MEMO,
    type,
    compare
  };
}

export {
  useState,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useImperativeHandle,
  useContext
};

export default {
  createElement,
  Fragment: REACT_FRABMENT,
  Component,
  createRef,
  forwardRef,
  createContext,
  cloneElement,
  PureComponent,
  memo,
};
