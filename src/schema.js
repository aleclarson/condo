// TODO: 'number[]' to indicate a typed array
// TODO: '~object' for instanceof checks

const ucase = /^[A-Z]/
const vowel = /^[aeiou]/i
const toString = Function.call.bind(Object.prototype.toString)
const slice = Function.call.bind(Array.prototype.slice)

const is = {
  any: null,
  array: 'Array.isArray(val)',
  boolean: isType('boolean'),
  date: isType(Date),
  error: isType(Error),
  false: eq(false),
  function: isType('function'),
  int: pass(isType('number'), 'val == Math.floor(val)'),
  number: pass(isType('number'), 'val == val'),
  null: eq(null),
  object: isType(Object),
  promise: `(val && typeof val.then == 'function')`,
  regexp: isType(RegExp),
  string: isType('string'),
  symbol: isType('symbol'),
  true: eq(true),
  uint: pass(isType('number'), 'val == Math.abs(Math.floor(val))'),
}

function eq(val) {
  return 'val === ' + String(val)
}

function pass() {
  return '(' + slice(arguments).join(' && ') + ')'
}

function isType(type) {
  if (typeof type == 'string') {
    return `typeof val == '${type}'`
  } else {
    return `_.parse(val) == '${type.name}'`
  }
}

function getType(val) {
  return val == null || typeof val == 'boolean' ? String(val)
    : val instanceof Error ? 'error'
    : val.constructor ? val.constructor.name
    : 'object'
}

const formatType = function() {
  const names = {
    any: 'any',
    false: 'false',
    null: 'null',
    true: 'true',
    undefined: 'undefined',
    Array: 'an array',
    Date: 'a date',
    Function: 'a function',
    Number: 'a number',
    Object: 'an object',
    Promise: 'a promise',
    String: 'a string',
    Symbol: 'a symbol',
  }
  return (type) => names[type] ||
    (article(type) + type + (ucase.test(type) ? ' object' : ''))
}()

function article(str) {
  return vowel.test(str) ? 'an ' : 'a '
}

// The utility namespace for validation.
const utils = {
  throw(key, val, type) {
    const _this = formatType(getType(val))
    const _that =
      type.slice(-1) == '?' ?
      formatType(type.slice(0, -1)) + ' or void' :
      formatType(type)

    throw TypeError(`'${key}' is ${_this}, expected ${_that}`)
  },
  parse(val, start) {
    return toString(val).slice(start || 8, -1)
  },
}

const schema_impl = `
return function validate(val, key, throws) {
  var type
  switch(key) {
    %s
  }
  if (!type) return true
  if (throws == 0) return false
  _.throw(key, val, type)
}`

exports.build = build
function build(schema) {
  // Convert type strings to assertions.
  let line, lines = []
  for (let key in schema) {
    let type = schema[key]
    if (type == null) continue

    let nullable = type.slice(-1) == '?'
    if (type == 'any') {
      line = nullable ? null : 'val != null'
    } else {
      line = []

      if (nullable) {
        line.push('val == null')
        type = type.slice(0, -1)
      }

      type = type.split(/\s*\|\s*/g)
      type.forEach(type => {
        const check = ucase.test(type) ?
          `val.constructor == window.${type}` : is[type]

        if (check) line.push(check)
        else throw Error(`Unknown type: '${type}'`)
      })

      type = type.join('|')
      if (nullable) type += '?'

      line = line.join(' || ')
    }
    if (line) {
      lines.push(`case '${key}': ${line} || (type = '${type}'); break`)
    }
  }

  // Create the validator.
  const impl = schema_impl.replace('%s', lines.join('\n    '))
  return new Function('_', impl)(utils)
}
