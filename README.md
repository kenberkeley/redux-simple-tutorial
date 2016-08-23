# Redux 简明教程

> 原文链接：https://github.com/kenberkeley/redux-simple-tutorial

> ### 写在前面  
> 学习一样新技术，难免会有些许的抵触感。尤其是遇到有难度的坎，觉得很难跨过去  
> 此时您可能会想：为什么我要折腾这东西？之前的技术已经够用了，没必要辛苦自己  
> 对此我的建议是：不妨先学着玩来装个逼。之后熟悉掌握，再慢慢考虑实用性的问题  
> 本教程的目的，就是助您轻松迈过这个坎。配套源码解读以及文档注释丰满的 Demo

## &sect; 为什么要用 Redux
> 当然还有 [Flux][flux]、[Reflux][reflux]、[Mobx][mobx] 等状态管理库可供选择

抛开需求讲实用性都是耍流氓，因此下面由我扮演您那可亲可爱的产品经理

### ⊙ 需求 1：在控制台上记录用户的每个动作

不知道您是否有后端的开发经验，后端一般会有记录访问日志的**中间件**  
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
[Logger] GET  /user?uid=10086
...
```

如果我们把场景转移到前端，请问该如何实现用户的动作跟踪记录？  
我们可能会这样写：

```js
/** jQuery **/
$('#loginBtn').on('click', function(e) {
  console.log('[Logger] 用户登录')
  ...
})
$('#logoutBtn').on('click', function() {
  console.log('[Logger] 用户退出登录')
  ...
})

/** MVC / MVVM 框架（这里以纯 Vue 举例） **/
methods: {
  handleLogin () {
    console.log('[Logger] 用户登录')
    ...
  },
  handleLogout () {
    console.log('[Logger] 用户退出登录')
    ...
  }
}
```

上述 jQuery 与 MV* 的写法并没有本质上的区别  
记录用户行为代码的侵入性极强，可维护性与扩展性堪忧

### ⊙ 需求 2：在上述需求的基础上，记录用户的操作时间
> 哼！最讨厌就是改需求了，这种简单的需求难道不是应该一开始就想好的吗？  
> 呵呵，如果每位产品经理都能一开始就把需求完善好，我们就不用加班了好伐

显然地，前端的童鞋又得一个一个去改（当然 编辑器 / IDE 都支持全局替换）：
```js
/** jQuery **/
$('#loginBtn').on('click', function(e) {
  console.log('[Logger] 用户登录', new Date())
  ...
})
$('#logoutBtn').on('click', function() {
  console.log('[Logger] 用户退出登录', new Date())
  ...
})

/** MVC / MVVM 框架（这里以 Vue 举例） **/
methods: {
  handleLogin () {
    console.log('[Logger] 用户登录', new Date())
    ...
  },
  handleLogout () {
    console.log('[Logger] 用户退出登录', new Date())
    ...
  }
}
```

而后端的童鞋只需要稍微修改一下原来的中间件即可：

```js
var loggerMiddleware = function(req, res, next) {
  console.log('[Logger]', new Date(), req.method, req.originalUrl)
  next()
}
...
app.use(loggerMiddleware)
```

### ⊙ 需求 3：正式上线的时候，把控制台中有关 Logger 的输出全部去掉
难道您以为有了 UglifyJS，配置一个 `drop_console: true` 就好了吗？图样图森破，拿衣服！  
前端的童鞋，请看清楚了，仅仅是去掉有关 Logger 的 `console.log`，其他的要保留哦亲~~~  
于是前端的童鞋又不得不乖乖地一个一个注释掉（当然也可以设置一个环境变量判断是否输出，甚至可以重写 `console.log`）

而我们后端的童鞋呢？只需要注释掉一行代码即可：`// app.use(loggerMiddleware)`，真可谓是不费吹灰之力

### ⊙ 需求 4：正式上线后，自动收集 bug，并还原出当时的场景
收集用户报错还是比较简单的，[利用 `window.error` 事件][global-err-handler]，然后根据 Source Map 定位到源码（但一般查不出什么）

但要完全还原出当时的使用场景，几乎是不可能的。因为您不知道这个报错，用户是怎么一步一步操作得来的  
就算知道用户是如何操作得来的，但在您的电脑上，测试永远都是通过的（不是我写的程序有问题，是用户用的方式有问题）

相对地，后端的报错的收集、定位以及还原却是相当简单。只要一个 API 有 bug，那无论用什么设备访问，都会得到这个 bug  
还原 bug 也是相当简单：把数据库备份导入到另一台机器，部署同样的运行环境与代码。如无意外，bug 肯定可以完美重现

> 在这个问题上拿后端跟前端对比，确实有失公允。但为了鼓吹 Redux 的优越，只能勉为其难了  
>
> 实际上 jQuery / MV* 中也能实现用户动作的跟踪，用一个数组往里面 `push` 用户动作即可  
> 但这样操作的意义不大，因为仅仅只有动作，无法反映动作前后应用状态的变动情况

### ※ 小结

为何前后端对于这类需求的处理竟然大相径庭？后端为何可以如此优雅？  
原因在于，后端具有**统一的入口**与**统一的状态管理（数据库）**，因此可以引入**中间件机制**来统一处理业务逻辑**以外**的功能  

多年来，前端工程师忍辱负重，操着卖白粉的心，赚着买白菜的钱，一直处于程序员鄙视链的底层  
于是有大牛就把后端 MVC 的开发思维搬到前端，**将应用中所有的动作与状态都统一管理**，让一切**有据可循**
  
使用 Redux，借助 [Redux DevTools][redux-devtools] 可以实现出“华丽如时光旅行一般的调试效果”  
实际上就是开发调试过程中可以**撤销与重做**，并且支持应用状态的导入和导出（就像是数据库的备份）  
而且，由于可以使用日志完整记录下每个动作，因此做到像 Git 般，随时随地恢复到之前的状态

> 由于可以导出和导入应用的状态（包括路由状态），因此可实现前后端同构（服务端渲染）

## &sect; Store
首先要区分 `store` 和 `state`

`state` 是应用的状态，一般本质上是一个普通**对象**  
例如，我们有一个 Web APP，包含 计数器 和 待办事项 两大功能  
那么我们可以为该应用设计出对应的存储数据结构（应用初始状态）：

```js
/** 应用初始 state，本代码块记为 code-1 **/
{
  counter: 0,
  todos: []
}
```

`store` 是应用状态 `state` 的管理者，包含下列四个函数：

* `getState()                  # 获取整个 state`
* `dispatch(action)            # ※ 触发 state 改变的【唯一途径】※`
* `subscribe(listener)         # 您可以理解成是 DOM 中的 addEventListener`
* `replaceReducer(nextReducer) # 一般在 Webpack Code-Splitting 按需加载的时候用`

二者的关系是：`state = store.getState()`

Redux 规定，一个应用只应有一个单一的 `store`，其管理着唯一的应用状态 `state`  
Redux 还规定，不能直接修改应用的状态 `state`，也就是说，下面的行为是不允许的：

```js
var state = store.getState()
state.counter = state.counter + 1 // 禁止直接在业务逻辑中修改 state
```

**若要改变 `state`，必须 `dispatch` 一个 `action`，这是修改应用状态的不二法门**  

> 现在您只需要记住 `action` 只是一个包含 **`type`** 属性的普通**对象**即可  
> 例如 `{ type: 'INCREMENT' }`

上面提到，`state` 是通过 `store.getState()` 获取，那么 `store` 又是怎么来的呢？  
想生成一个 `store`，我们需要调用 Redux 的 `createStore`：

```js
import { createStore } from 'redux'
...
const store = createStore(reducer, initialState) // store 是靠传入 reducer 生成的哦！
```  
> 现在您只需要记住 `reducer` 是一个 **函数**，负责**更新并返回**一个**新的** `state`  
> 而 `initialState` 主要用于前后端同构的数据同步（详情请关注 React 服务端渲染）   

## &sect; Action
上面提到，`action`（动作）实质上是包含 `type` 属性的普通对象，这个 `type` 是我们实现用户行为追踪的关键  
例如，增加一个待办事项 的 `action` 可能是像下面一样：

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
/** 如下都是合法的，但就是不够规范 **/
{
  type: 'ADD_TODO',
  id: 1,
  content: '待办事项1',
  completed: false
}

{
  type: 'ADD_TODO',
  abcdefg: {
    id: 1,
    content: '待办事项1',
    completed: false
  }
}
```

> 虽说没有约束，但最好还是遵循[规范][flux-action-pattern]

如果需要新增一个代办事项，实际上就是将 `code-2` 中的 `payload` **“写入”** 到 `state.todos` 数组中（如何“写入”？在此留个悬念）：

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

刨根问底，`action` 是谁生成的呢？

### ⊙ Action Creator
> Action Creators 可以是同步的，也可以是异步的

顾名思义，Action Creator 是 `action` 的创造者，本质上就是一个**函数**，返回值是一个 `action`（**对象**）  
例如下面就是一个 “新增一个待办事项” 的 Action Creator：

```js
/** 本代码块记为 code-4 **/
var id = 1
function addTodo(content) {
  return {
    type: 'ADD_TODO',
    payload: {
      id: id++,
      content: content, // 待办事项内容
      completed: false  // 是否完成的标识
    }
  }
}
```

将该函数应用到一个表单（假设 `store` 为全局变量，并引入了 jQuery ）：

```html
<--! 本代码块记为 code-5 -->
<input type="text" id="todoInput" />
<button id="btn">提交</button>

<script>
$('#btn').on('click', function() {
  var content = $('#todoInput').val() // 获取输入框的值
  var action = addTodo(content) // 执行 Action Creator 获得 action
  store.dispatch(action) // 改变 state 的不二法门：dispatch 一个 action！！！
})
</script>
```

在输入框中输入 “待办事项2” 后点击一下按钮，我们的 `state` 就变成了：

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

> 通俗点讲，Action Creator 用于绑定到用户的操作（点击按钮等），其返回值 `action` 用于触发 `dispatch(action)`

刚刚提到过，`action` 明明就没有强制的规范，为什么 `store.dispatch(action)` 之后  
Redux 会明确知道是提取 `action.payload`，并且是对应写入到 `state.todos` 数组中？又是谁负责“写入”的呢？  
悬念即将揭晓...

## &sect; Reducer
> Reducers 必须是同步的纯函数  

用户每次 `dispatch(action)` 后，都会触发 `reducer`  的执行  
`reducer` 的实质是一个**函数**，根据 `action.type` 来***更新*** `state` 并返回 `nextState`  
`store` 作为 `state` 的管理者，会收到 `reducer` 的返回来的 `nextState`，并用它**完全替换掉**原来的 `state`

> 注意：上面的这个 “更新” 并不是指 `reducer` 可以直接对 `state` 进行修改  
> Redux 规定，须先克隆一份 `state`，在副本 `nextState` 上进行修改操作  
> 例如，可以使用 lodash 的 `deepClone`，也可以使用 `Object.assign / map / filter/ ...` 等返回副本的函数

在上面 Action Creator 中提到的 待办事项的 `reducer` 大概是长这个样子 (为了容易理解，在此不使用 ES6 / [Immutable.js][immutable])：

```js
/** 本代码块记为 code-7 **/
var initState = {
  counter: 0,
  todos: []
}

function reducer(state, action) {
  // ※ 应用的初始状态是在第一次执行 reducer 时设置的（除非是服务端渲染） ※
  if (!state) state = initState
  
  switch (action.type) {
    case 'ADD_TODO':
      var nextState = _.deepClone(state) // 用到了 lodash 的深克隆
      nextState.todos.push(action.payload) 
      return nextState // 返回的这个 nextState，就是 code-6

    default:
    // 由于 nextState 会把原 state 整个替换掉
    // 若无修改，必须返回原 state（否则就是 undefined）
      return state
  }
}
```

> 通俗点讲，就是 `reducer` 返回啥，`store` 就会不假思索地把 `state` 替换成啥

## &sect; 总结

* `store` 由 Redux 的 `createStore(reducer)` 生成
* `state` 通过 `store.getState()` 获取，本质上一般是一个存储着整个应用状态的**对象**
* `action` 本质上是一个包含 `type` 属性的普通**对象**，由 Action Creator (**函数**) 产生
* 改变 `state` 必须 `dispatch` 一个 `action` 来触发 Redux 执行 `reducer(state, action)` 以更新 `state`
* `reducer` 本质上是根据 `action.type` 来更新 `state` 并返回 `nextState` 的**函数**
* `reducer` 不能返回空值，因为 `store` 会把它的返回值直接替换掉原来的 `state`
* 实际上，**`state` 就是所有 `reducer` 返回值的汇总**（本教程只有一个 `reducer`，主要是应用场景比较简单）

> Action Creator => `action` => `store.dispatch(action)` => `reducer(state, action)` => ~~`原 state`~~ `state = nextState`

### ⊙ Redux 与传统后端 MVC 的对照
Redux | 传统后端 MVC
---|---
`store` | 数据库实例
`state` | 数据库中存储的数据
`dispatch(action)` | 用户发起请求
`action: { type, payload }` | `type` 表示请求的 URL，`payload` 表示请求的数据
`reducer` 中的 `switch-case` 分支 | 路由，根据 `action.type` 路由到对应的控制器
`reducer` 内部对 `state` 的处理 | 控制器对数据库进行增删改操作
`reducer` 返回 `nextState` 给 `store` | 将修改后的记录写回数据库

## &sect; 最简单的例子 ( [在线演示][jsbin] )

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

console.log( store.getState() ); // { counter: 0 }

store.dispatch(inc());
console.log( store.getState() ); // { counter: 1 }

store.dispatch(inc());
console.log( store.getState() ); // { counter: 2 }

store.dispatch(dec());
console.log( store.getState() ); // { counter: 1 }
</script>
</body>
</html>

```

> 由上可知，Redux 并不一定要搭配 React 使用。Redux 纯粹只是一个状态管理库，几乎可以搭配任何框架使用  
> （上述例子连 jQuery 都没用哦亲）

## [&sect; 下一章：Redux 进阶教程（包含源码分析）](./redux-advanced-tutorial.md)

[flux]: https://github.com/facebook/flux
[reflux]: https://github.com/reflux/refluxjs
[mobx]: https://github.com/mobxjs/mobx
[redux]: https://github.com/reactjs/redux
[flux-action-pattern]: https://github.com/acdlite/flux-standard-action
[global-err-handler]: http://stackoverflow.com/questions/5328154/#5328206
[redux-devtools]: https://github.com/gaearon/redux-devtools
[immutable]: https://github.com/facebook/immutable-js
[jsbin]: http://jsbin.com/zivare/edit?html,console