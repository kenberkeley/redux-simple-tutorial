## <a name="react-stack-basic-concepts">&sect; React 技术栈基本概念</a>

[decorator]: http://es6.ruanyifeng.com/#docs/decorator
[flux-action-pattern]: https://github.com/acdlite/flux-standard-action
[immutable]: https://github.com/facebook/immutable-js

### <a name="components">⊙ 展示型组件与容器组件（木偶组件与智能组件）</a>
在 Vue Demo 中，组件相关的只有 `components/`，但在此却多了一个 `containers/`，为何？  
我们知道，在 React + Redux 应用中，想要获取到数据，有两种方式：  
（1）父组件通过 `props` 传递给子组件（这跟 Vue 是一样的）

```
// 这里是 Father 组件内
render () {
  return (
    <Son foo={this.props.foo} />
  )
}
```
父组件可以传数据给子组件，那么请问父组件的数据哪里来？  
您可能会说，是从父组件的父组件那里传下来的。。。  
好吧，那换个问法：请问它们**最祖先**的组件的数据从哪里来？  
这就引出了下面第二种方式

（2）直接从 Store 中取  
所谓的智能组件，实际上就是将木偶组件与数据源**连接**起来，***它本身可以不是组件***，而仅作为一个连接件  
不明白？举个例子，请看 `src/containers/Msg/MsgDetail.js`：
```
import { connect } from 'react-redux' // 这个就是【连接】函数
import { default as actions } from 'ACTION/msg' // 类似于 Vue 组件中的 methods
import MsgDetail from 'COMPONENT/Msg/MsgDetail' // 引入木偶组件

// 待传入的actions
const mapActionCreators = actions // 有 fetchMsg / addMsg / modMsg / delMsg 四个方法

// 待传入的数据源（从store中传入。看到下面这个函数，知道我刚才为什么要考你ES6了吧）
const mapStateToProps = ({ userData, msgs }) => ({ userData, msgs })

// 连接完毕！由此看来，将木偶组件这样子【包裹】起来，就算是一个智能组件
export default connect(mapStateToProps, mapActionCreators)(MsgDetail)
```

在 `src/components/Msg/MsgDetail.js` 中就可以访问到这些传入的数据：
```
render () {
  let { userData, delMsg } = this.props
  ...
}
```
> 简单粗暴地区分木偶组件与智能组件，就是看数据源是父组件传下来的还是直接从 Store 中获取的  
> 木偶组件若想直接**连接**到 Store，需要靠对应的智能组件进行**包裹**
 
同理还有 `src/containers/` 下的 `MsgForm.js` 和 `MsgList.js`  
代码内容都是极其相似的，基本上就是复制粘贴改个名字  

> 老司机们很喜欢用 [装饰器](decorator) 来避免重复写这些固有的**连接包裹**代码