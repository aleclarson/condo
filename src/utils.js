
exports.createClass = function(name, args, impl, scope) {
  const ctr = makeCtr(name, args, impl)
  return Function
    .apply(null, Object.keys(scope).concat(ctr))
    .apply(null, Object.values(scope))
}

function makeCtr(name, args, impl) {
  if (Array.isArray(impl)) impl = impl.join('\n')
  impl = '{\n  ' + impl.replace(/\n/g, '\n  ') + '\n}'
  return `var ctr\nreturn ctr = function ${name}(${args.join(', ')}) ` + impl
}

exports.mapFilter = function(arr, fn) {
  const out = []
  for (let i = 0, val; i < arr.length; i++) {
    val = fn(arr[i], i)
    if (val != null) {
      out.push(val)
    }
  }
  return out
}

exports.nextTick = function(fn) {
  p.then(fn).catch(onError)
}

function onError(err) {
  setTimeout(() => console.error(err.stack), 0)
}

exports.priv = function(obj, key, value) {
  Object.defineProperty(obj, key, { value, writable: true })
}
