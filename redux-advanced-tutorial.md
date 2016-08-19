# Redux 进阶教程

[simple-tutorial]: https://github.com/kenberkeley/react-simple-tutorial
[redux-src]: https://github.com/reactjs/redux/tree/master/src
[deep-in-redux]: http://zhenhua-lee.github.io/react/redux.html

> ### 写在前面  
> 相信您已经看过 [Redux 简明教程][simple-tutorial]  
> 本教程是简明教程的实战化版本，伴随源码分析

## &sect; Redux API 总览
在 Redux 的[源码目录][redux-src] `src/`，我们可以看到如下文件结构：

```
├── utils/
│     ├── warning.js # 打酱油的，负责在控制台显示警告信息
├── applyMiddleware.js
├── bindActionCreators.js
├── combineReducers.js
├── compose.js
├── createStore.js
├── index.js # 入口文件
```

除去打酱油的 `utils/warning.js` 以及入口文件 `index.js`，剩下那 5 个就是 Redux 的 API

## &sect; Redux API 之 createStore
### ⊙ 源码分析



## &sect; Redux API 之 combineReducers
### ⊙ 应用场景

简明教程中的 `code-7` 如下：

```js
/** 本代码块记为 code-7 **/
var initState = {
  counter: 0,
  todos: []
}

function reducer(state, action) {
  if (!state) state = initState
  
  switch (action.type) {
    case 'ADD_TODO':
      var nextState = _.deepClone(state) // 用到了 lodash 的深克隆
      nextState.todos.push(action.payload) 
      return nextState

    default:
      return state
  }
}
```

上面的 `reducer` 仅仅是实现了 “新增待办事项” 的 `state` 的处理  
我们还有计数器的功能，下面我们继续增加计数器 “增加 1” 的功能：

```js
/** 本代码块记为 code-8 **/
var initState = { counter: 0, todos: [] }

function reducer(state, action) {
  if (!state) return initState // 若是初始化可立即返回应用初始状态
  
  var nextState = _.deepClone(state) // 否则二话不说先克隆
  
  switch (action.type) {
    case 'ADD_TODO': // 新增待办事项
      nextState.todos.push(action.payload) 
      break
      
    case 'INCREMENT': // 计数器加 1
      nextState.counter = nextState.counter + 1
      break

    default: // 没有操作
      break
  }
  
  return nextState
}
```

如果说还有其他的动作，都需要在 `code-8` 这个 `reducer` 中继续堆砌处理逻辑  
但我们知道，计数器 与 待办事项 属于两个不同的模块，不应该都堆在一起写  
如果之后又要引入新的模块（例如留言板），该 `reducer` 会越来越臃肿  
此时就是 `combineReducer` 大显身手的时刻：

```
/** 本代码块记为 code-9 **/
import { combineReducers } from 'redux'

const initState = {
  counter: 0,
  todos: []
}

function counterReducer(counter = initState.counter, action) {
  switch (action.type) {
    case 'INCREMENT':
      return counter + 1 // counter 是值传递，因此可以直接返回一个值
    default:
      return counter
  }
}

function todosReducer(todos = initState.todos, action) {
  switch (action.type) {
    case 'ADD_TODO':
      return [ ...todos, action.payload ]
    default:
      return todos
  }
}

// 对应着 initState 中的数据结构
const rootReducer = combineReducers({
  counter: counterReducer,
  todos: todosReducer
})
```

`code-8 reducer` 与 `code-9 rootReducer` 的功能是一样的  
但后者中，每个子 `reducer` 仅维护对应的那部分 `state`  
可操作性与可维护性大大增强

> Flux 中是根据不同的功能拆分出多个 `store` 分而治之  
> 而 Redux 只允许应用中有唯一的 `store`，通过拆分出多个 `reducer` 分别管理对应的 `state`

一直以来我们的应用状态都是只有两层，如下所示：

```
state
  ├── counter: 0
  ├── todos: []
```

如果说现在又有一个需求：在待办事项模块中，存储用户每次操作（增删改）的时间，那么此时应用状态树应为：

```
state
  ├── counter: 0
  ├── todo
        ├── optTime: []
        ├── todoList: [] # 这就是原来的 todos！
```

那么对应的 `reducer` 就是（我们假设待办事项的 action.type 都包含 "TODO" 关键字）：

```
/** 本代码块记为 code-10 **/
import { combineReducers } from 'redux'
const initState = { counter: 0, todo: { optTime: [], todoList: [] } }

function counterReducer（略）

/* Todo Reducer */
// 子 reducer - optTime
function optTimeReducer(optTime = initState.todo.optTime, action) {
  // 包含 TODO 关键字就写入当前时间，否则返回原 state（即 optTime）
  // 咦？这里怎么没有 switch-case 分支？谁说 reducer 就一定包含 switch-case 分支的？
  return action.type.includes('TODO')) ? [ ...optTime, new Date() ] : optTime
}

// 子 reducer - todoList
function todoListReducer(todoList = initState.todo.todoList, action) {
  switch (action.type) {
    case 'ADD_TODO':
      return [ ...todoList, action.payload ]
    default:
      return todoList
  }
}

// 父 reducer - todo
const todoReducer = combineReducers({
  optTime: optTimeReducer, // 键值要对应 initState，若写成 optXXX，那么最终生成的 state 树也会使用 optXXX
  todoList: todoListReducer
})
/* Todo Reducer End */

const rootReducer = combineReducers({
  counter: counterReducer,
  todo: todoReducer
})
```

我们可以看到，使用 `combineReducers` 的场景主要在应用状态树的父节点，用于合并分支：

```
state
  ├── counter: 0
  ├── todo <—————————————————— 在这里合并分支
        ├── optTime: []
        ├── todoList: []
```

无论您的应用状态树有多么的复杂，都可以通过层层分支，分而治之地管理对应部分的 `state`

您可能会有这么一个疑问：如果 `dispatch` 的是 计数器 的 `action`，例如 `{ type: 'INCREMENT' }` 让计数器加一  
那么会不会流经 待办事项 对应的 `todosReducer (code-9 中) / optTimeReducer / todoListReducer`？

答案是“会”！  
表面上看来，这样子很浪费性能，但 JavaScript 对于这种纯函数的调用是很高效率的，因此请尽管放心

### ⊙ 源码分析



## &sect; Redux API 之 bindActionCreators

简明教程中的 `code-5` 如下：

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

我们看到，调用 `addTodo` 这个 Action Creator 后，得到一个 `action`，然后又要 `dispatch(action)`  
如果是只有一个两个 Action Creator 还是可以接受，但如果有很多个那就显得有点重复了  
重复的部分在于 `dispatch(action)`，这部分我们可以利用 `bindActionCreators` 实现自动 `dispatch`

```html
<--! 本代码块记为 code-5 -->
<input id="todoInput" type="text" />
<button id="btn">提交</button>

<script>
var actionsCreators = Redux.bindActionCreators({
  addTodo: addTodo
}，store.dispatch)

$('#btn').on('click', function() {
  var content = $('#todoInput').val()
  actionCreators.addTodo(content)
})
</script>
```

`bindActionCreators` 的原理相当简单，无非就是帮我们调用了 `store.dispatch(addTodo(content))`，仅此而已