# 中间件的洋葱模型

[redux-advanced-tutorial]: https://github.com/kenberkeley/redux-simple-tutorial/blob/master/redux-advanced-tutorial.md

> 本文是 [Redux 进阶教程][redux-advanced-tutorial] 的拓展阅读

## &sect; Express 的中间件

```
/** app.js **/
var express = require('express')
var app = express()

app.use(function middleware1(req, res, next) {
  console.log('A middleware1 开始')
  next()
  console.log('B middleware1 结束')
})

app.use(function middleware2(req, res, next) {
  console.log('C middleware2 开始')
  next()
  console.log('D middleware2 结束')
})

app.use(function middleware3(req, res, next) {
  console.log('E middleware3 开始')
  next()
  console.log('F middleware3 结束')
})

app.get('/', function handler(req, res) {
  res.send('ok')
  console.log('======= G =======')
})

if (module.parent) {
  module.exports = app
} else {
  app.listen(8080)
}
```

敲下 `node app.js` 后，访问 `localhost:8080`，控制台会输出：

```
A middleware1 开始
C middleware2 开始
E middleware3 开始
======= G =======
F middleware3 结束
D middleware2 结束
B middleware1 结束
```

下面是该请求的示意图：

```
            --------------------------------------
            |            middleware1              |
            |    ----------------------------     |
            |    |       middleware2         |    |
            |    |    -------------------    |    |
            |    |    |  middleware3    |    |    |
            |    |    |                 |    |    |
          next next next  ———————————   |    |    |
请 ————————————————————> |  handler  | ----------->
求 <———————————————————— |     G     |  |    |    |
            | A  | C  | E ——————————— F |  D |  B |
            |    |    |                 |    |    |
            |    |    -------------------    |    |
            |    ----------------------------     |
            --------------------------------------


顺序 A -> C -> E -> G -> F -> D -> B
    \---------------/
            ↓
        请求响应完毕
```

## &sect; Redux 的中间件[（在线演示）](http://jsbin.com/pazica/edit?html,console)

```
<!DOCTYPE html>
<html>
<head>
  <script src="//cdn.bootcss.com/redux/3.5.2/redux.min.js"></script>
</head>
<body>
<script>
function middleware1(store) {
  return function(next) {
    return function(action) {
      console.log('A middleware1 开始');
      next(action)
      console.log('B middleware1 结束');
    };
  };
}

function middleware2(store) {
  return function(next) {
    return function(action) {
      console.log('C middleware2 开始');
      next(action)
      console.log('D middleware2 结束');
    };
  };
}

function middleware3(store) {
  return function(next) {
    return function(action) {
      console.log('E middleware3 开始');
      next(action)
      console.log('F middleware3 结束');
    };
  };
}
  
function reducer(state, action) {
  if (action.type === 'MIDDLEWARE_TEST') {
    console.log('======= G =======');  
  }
  return {};
}
  
var store = Redux.createStore(
  reducer,
  Redux.applyMiddleware(
    middleware1,
    middleware2,
    middleware3
  )
);

store.dispatch({ type: 'MIDDLEWARE_TEST' });
</script>
</body>
</html>
```

控制台输出：

```
A middleware1 开始
C middleware2 开始
E middleware3 开始
======= G =======
F middleware3 结束
D middleware2 结束
B middleware1 结束
```

下面是该请求的示意图：

```
            --------------------------------------
            |            middleware1              |
            |    ----------------------------     |
            |    |       middleware2         |    |
            |    |    -------------------    |    |
            |    |    |  middleware3    |    |    |
            |    |    |                 |    |    |
          next next next  ———————————   |    |    |
dispatch ——————————————> |  reducer  | ----------->
            |    |    |  |     G     |  |    |    |
            | A  | C  | E ——————————— F |  D |  B |
            |    |    |                 |    |    |
            |    |    -------------------    |    |
            |    ----------------------------     |
            --------------------------------------


顺序 A -> C -> E -> G -> F -> D -> B
```

## &sect; 总结
顺序：层层进入，层层冒出  
就像一颗子弹穿过洋葱的体验