# Redux 进阶教程

[simple-tutorial]: https://github.com/kenberkeley/react-simple-tutorial

> ### 写在前面  
> 相信您已经看过 [Redux 简明教程][simple-tutorial]  
> 下面主要对简明教程中的示例进行优化  
> 并介绍 Redux 生态圈中常见的 Pacakges  

## &sect; Redux API 之 combineReducers

简明教程中的 `code-7` 如下：

```js
/** 本代码块记为 code-7 **/
var initState = {
  counter: 0,
  todos: []
}

function reducer(state, action) {
  // 应用的初始状态是在第一次执行 reducer 时设置的（除非是服务端渲染）
  if (!state) state = initState
  
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

上面的 `reducer` 仅仅是实现了 “新增待办事项” 的 `state` 的处理  
我们还有计数器的功能，下面我们继续增加计数器 “增加 1” 的功能：

```js
/** 本代码块记为 code-8 **/
var initState = {
  counter: 0,
  todos: []
}

function reducer(state, action) {
  state = state || initState
  
  var nextState = _.deepClone(state) // 二话不说先克隆
  
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
  
  return nextState // 最后一定要返回一个 state，管它有没有被修改
}
```

如果说还有其他的动作，都需要在 `code-8` 这个 `reducer` 中继续堆砌处理逻辑  
但我们知道，计数器 与 待办事项 属于两个不同的模块，不应该都堆在一起写  
如果之后又要引入新的模块（例如留言板），该 `reducer` 会越来越臃肿  
此时就是 `combineReducer` 大显身手的时刻

> Flux 中是根据不同的功能拆分出多个 `store`  
> 而 Redux 只允许应用中仅有的一个 `store` 拆分出多个 `reducer` 分别管理对应的 `state`

```
/** 本代码块记为 code-9 **/
var initState = {
  counter: 0,
  todos: []
}

function counterReducer(counter, action) {
  counter = counter || initState.counter
  
  switch (action.type) {
    case 'INCREMENT':
      return counter + 1 // counter 是值传递，因此可以直接返回一个值

    default:
      return counter
  }
}

function todosReducer(todos, action) {
  todos = todos || initState.todos
  
  switch (action.type) {
    case 'ADD_TODO':
      var nextTodos = todos.slice() // todos 是引用传递，因此需要克隆一份
      nextTodos.push(action.payload)
      return nextTodos
    
    default:
      return todos
  }
}

// 对应着 initState 中的数据结构
var rootReducer = combineReducers({
  counter: counterReducer,
  todos: todosReducer
})
```

`code-8 reducer` 与 `code-9 rootReducer` 的功能是一样的  
但后者中，每个子 `reducer` 仅维护对应的那部分 `state`  
可操作性与可维护性大大增强

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