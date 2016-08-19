/**
 * 看起来逼格很高的样子，实际上作用就是：
 * compose(f, g, h)(...arg) => f(g(h(...args)))
 *
 * 值得注意的是，它用到了 reduceRight，因此执行顺序是从右到左
 *
 * @param  {多个函数，用逗号隔开}
 * @return {函数}
 */

export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  const last = funcs[funcs.length - 1]
  const rest = funcs.slice(0, -1)
  return (...args) => rest.reduceRight((composed, f) => f(composed), last(...args))
}
