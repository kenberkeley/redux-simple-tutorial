# Redux 简明教程
> ### 写在前面  
> 在开始下面的内容前，您最好已经看过 [Redux 中文文档](redux-cn-docs)  
> 最好还把玩过 [Redux Example](redux-example) 中的 counter / todos 示例  
> 如果折腾完后，您还是对 Redux 的理解一片混乱  
> 那么很恭喜您，本文就是针对您这种状况而写的  

## &sect; 为什么要用 Redux
> 当然还有 [Flux](flux)、[Reflux](reflux)、[Mobx](mobx) 等状态管理库可供选择

不知道您是否有后端的开发经验  
后端一般会有记录访问日志的**中间件**  
例如，在 Express 中实现一个简单的 Logger 如下：

```js
var loggerMiddleware = function(req, res, next) {
  console.log('[Logger]', req.method, req.originalUrl)
  next()
}
...
app.use(loggerMiddleware)
```

每次访问的时候，都会在控制台中留下类似下面的日志便于追踪调试：

```
[Logger] GET  /
[Logger] POST /login
...
```

如果我们把场景转移到前端，请问如何实现用户的动作跟踪记录？  
我们可能会这样写：

```js
/** jQuery **/
$('#loginBtn').on('click', function(e) {
  console.log('用户登录')
  ...
})
$('#logoutBtn').on('click', function() {
  console.log('用户退出登录')
  ...
})

/** MVC / MVVM 框架（这里以 Vue 举例） **/
methods: {
  handleLogin () {
    console.log('用户登录')
    ...
  },
  handleLogout () {
    console.log('用户退出登录')
    ...
  }
}
```

上述 jQuery 与 MV* 的写法并没有本质上的区别  
记录用户行为代码的**侵入性**极强，可维护性可扩展性堪忧

如果又有一个需求：记录用户是什么时刻触发的呢  
那么前端的童鞋又得一个一个去改，相当痛苦！

而后端的童鞋笑而不语，又潇洒地写下了一个中间件： 
 
```js
var momentMiddleware = function (req, res, next) {
  console.log('触发时刻', Date.now())
}
...
app.use(momentMiddleware)
```

为何前后端对于这类需求的处理竟然大相径庭？后端为何可以如此优雅？  
原因在于，后端具有**统一的入口**与**统一的数据库**  
而且后端可以相当容易列出所有 API，例如：

```
GET  /        # 首页
POST /login   # 请求登录
GET  /logout  # 退出登录
...
```

而前端想要列出用户的所有动作却相当困难，皆因动作都是散落在整个应用

***

Redux 一直鼓吹的 “ 实现出华丽如时光旅行一般的调试效果 ”  
实际上就是可实现开发调试过程中的**撤销与重做**（详情请看 [Redux DevTools](redux-devtools)）  

使用 Redux，就可以将应用的所有状态都保存快照  
而且由于可以记录动作的日志，那就可以像 Git 般  
随时随地都可以恢复到之前的状态  
但跟 Git 这种复杂的增量版本管理不一样  
Redux 仅仅是简单粗暴地将整个应用状态克隆保存  
就像是当年用压缩包充当版本管理一样：`proj.v1.zip`、`proj.v2.rar` ...

总结一下：Redux 与传统的开发方式不一样在于：  
将所有的动作与状态都统一管理，有据可循  
因此，开发过程中实现撤销重做、记录日志等操作易如反掌

## &sect; Store
首先要区分 `store` 和 `state`

`state` 是应用的状态，一般本质上是一个**对象**，呈树形结构  
例如，我们有一个 Web APP，包含 计数器 和 待办事项 两大功能  
那么我们可以为该应用设计出对应的存储数据结构（应用初始状态）：

```js
/** 应用初始 state，本代码块记为 code-1 **/
{
  counter: 0,
  todos: []
}
```

`store` 是管理应用状态 `state` 的对象，包含下列四个函数：

* `getState()                  # 获取整个 state`
* `dispatch(action)            # 触发 state 改变的唯一途径`
* `subscribe(listener)         # 你可以理解成是 DOM 中的 addEventListener`
* `replaceReducer(nextReducer) # 一般在 Webpack Code-Splitting 按需加载的时候用`

二者的关系是：`state = store.getState()`

Redux 规定，一个应用只应有一个单一的 `store`，其管理着唯一的应用状态 `state`  
Redux 还规定，不能直接修改应用的状态 `state`，也就是说，下面的行为是不允许的：

```js
var state = store.getState()
state.counter = state.counter + 1
```

若要改变 `state`，必须 `dispatch` 一个 `action`，这是修改应用状态的**不二法门**  

> 现在您只需要记住 `action` 只是一个包含 `type` 属性的普通**对象**即可  
> 例如 `{ type: 'INCREMENT' }`

`state` 是通过 `store.getState()` 得来的，那么 `store` 又是怎么来的呢？  
想生成一个 `store`，我们需要调用 Redux 的 `createStore`：

```js
import { createStore } from 'redux'
...
const store = createStore(reducer, initialState)
```  
> 现在您只需要记住 `reducer` 是一个 **函数**，负责**更新并返回**一个**新的** `state`  
> 而 `initialState` 主要用于前后端同构的数据同步（详情请关注服务端渲染）   

## &sect; Action
上面提到，`action`（动作）实质上是包含 `type` 属性的普通对象  
这个 `type` 是我们实现用户行为追踪的关键

例如，增加一个待办事项的 `action` 可能是像下面一样：

```js
/** 本代码块记为 code-2 **/
{
  type: 'ADD_TODO',
  payload: {
    id: 1,
    content: '待办事项1',
    completed: false
  }
}
```

当然，`action` 的形式是多种多样的，唯一的约束仅仅就是包含一个 `type` 属性罢了  
也就是说，下面这些 `action` 都是合法的：

```js
/** 我们都是合法的，但就是不够规范 **/
{
  type: 'ADD_TODO',
  id: 1,
  content: '待办事项1',
  completed: false
}

{
  type: 'ADD_TODO',
  todo: {
    id: 1,
    content: '待办事项1',
    completed: false
  }
}
```

> 虽说没有约束，但最好还是遵循[规范](flux-action-pattern)

如果我们需要新增一个代办事项  
实际上就是将 `code-2` 中的 `payload` **“写入”**到 `code-1 应用初始状态 state.todos` 数组中：

```js
/** 本代码块记为 code-3 **/
{
  counter: 0,
  todos: [{
    id: 1,
    content: '待办事项1',
    completed: false
  }]
}
```

### ⊙ Action Creator
> Action Creators 可以是同步的，也可以是异步的

顾名思义，Action Creator 是 `action` 的创造者  
本质上就是一个**函数**，返回值是一个 `action` **对象**  
例如下面就是一个 “新增一个待办事项” 的 Action Creator：

```js
/** 本代码块记为 code-4 **/
var id = 1
function addTodo(content) {
  return {
    type: 'ADD_TODO',
    payload: {
      id: id++,
      content: content,
      completed: false
    }
  }
}
```

将该函数应用到一个表单（假设 `store` 为全局变量，并引入了 jQuery ）：

```html
<--! 本代码块记为 code-5 -->
<input id="todoInput" type="text" />
<button id="btn">提交</button>

<script>
$('#btn').on('click', function() {
  var content = $('#todoInput').val() // 获取输入框的值
  var action = addTodo(content) // 执行 Action Creator 获得 action
  store.dispatch(action) // 改变 state 的不二法门：dispatch 一个 action
})
</script>
```

在输入框中输入“待办事项2”，随后点击一下按钮，我们的 `state` 就变成了：

```js
/** 本代码块记为 code-6 **/
{
  counter: 0,
  todos: [{
    id: 1,
    content: '待办事项1',
    completed: false
  }, {
    id: 2,
    content: '待办事项2',
    completed: false
  }]
}
```

刚刚提到过，`action` 明明就没有强制的规范  
为什么 `store.dispatch(action)` 之后，Redux 会明确知道是提取 `action.payload`  
并且是对应写入 `state.todos` 数组中？这就是 `reducer` 的作用，请继续往下看

## &sect; Reducer
> Reducers 必须是同步的函数  

用户 `dispatch(action)` 后，会触发 `reducer`  的执行  
`reducer` 的实质是一个函数，根据 `action.type` 来更新 `state` 并返回**新的** `state`

在上面 Action Creator 中提到的 `reducer` 大概是长这个样子 (为了容易理解，在此不使用 ES6 / [Immutable.js](immutable))：

```js
/** 本代码块记为 code-7 **/
function reducer(state, action) {
  // 应用初始状态是在第一次执行 reducer 时设置的（除非是服务端渲染）
  state = state || { counter: 0, todos: [] }
  
  switch (action.type) {
    case 'ADD_TODO':
      var nextState = _.deepClone(state) // 用到了 lodash 的深克隆
      nextState.todos.push(action.payload) 
      return nextState // 返回的这个 nextState，就是 code-6

    default: // 没有任何更改必须返回 state
      return state
  }
}
```

为什么不能直接 `state.todos.push(action.payload)`，要克隆一份 `nextState` 后才操作？  
因为这是 Redux 规定的，主要原因是 JS 复杂数据结构（对象、数组）传的是引用  
Redux 还规定，若没有任何修改，**一定要返回一个 `state`**，否则整个 `state` 都会被 `undefined` 替换

## &sect; 总结

* `store` 由 Redux 的 `createStore(reducer)` 生成
* `state` 通过 `store.getState()` 获取，本质上一般是一个存储着整个应用状态的**对象**
* `action` 本质上是一个包含 `type` 属性的普通**对象**，由 Action Creator (**函数**) 产生
* 改变 `state` 必须 `dispatch` 一个 `action`，Redux 会自动执行 `reducer(state, action)` 函数
* `reducer` 本质上是根据 `action.type` 来更新 `state` 并返回 `nextState` 的**函数**
* `reducer` 不能返回空值，因为 Redux 会把它的返回值直接替换掉原来的 `state`

> Action Creator => `action` => `store.dispatch(action)` => `reducer(state, action)` => `nextState`

### ⊙ Redux 与后端的对照
Redux | 后端
---|---
`store` | 数据库实例 
`state` | 数据库中存储的数据 
`dispatch` | 发起请求
`action` | 请求的 API
`reducer` 中的 `switch` 分支 | 路由
`reducer` 中 `case` 内部对 `state` 的处理 | 控制器对数据库进行增删改
`reducer` 返回的 `nextState` | 将修改后的记录写回数据库

## &sect; 最简单的例子

```html
<!DOCTYPE html>
<html>
<head>
  <script src="//cdn.bootcss.com/redux/3.5.2/redux.min.js"></script>
</head>
<body>
<script>
/** Action Creators */
function inc() {
  return { type: 'INCREMENT' };
}
function dec() {
  return { type: 'DECREMENT' };
}

function reducer(state, action) {
  // 首次调用本函数时设置初始 state
  state = state || { counter: 0 };

  switch (action.type) {
    case 'INCREMENT':
      return { counter: state.counter + 1 };
    case 'DECREMENT':
      return { counter: state.counter - 1 };
    default:
      return state; // 无论如何都返回一个 state
  }
}

var store = Redux.createStore(reducer);

store.getState(); // { counter: 0 }

store.dispatch(inc());
store.getState(); // { counter: 1 }

store.dispatch(inc());
store.getState(); // { counter: 2 }

store.dispatch(dec());
store.getState(); // { counter: 1 }
</script>
</body>
</html>

```

[redux-cn-docs]: http://cn.redux.js.org/
[redux-example]: https://github.com/reactjs/redux/tree/master/examples
[immutable]: https://github.com/facebook/immutable-js
[flux]: https://github.com/facebook/flux
[reflux]: https://github.com/reflux/refluxjs
[mobx]: https://github.com/mobxjs/mobx
[redux]: https://github.com/reactjs/redux
[flux-action-pattern]: https://github.com/acdlite/flux-standard-action
[redux-devtools]: https://github.com/gaearon/redux-devtools
