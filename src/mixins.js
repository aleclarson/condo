const {mapFilter} = require('./utils')
const event = require('./event')

exports.EventMixin = {
  on(name, fn) {
    if (typeof fn == 'function')
      this._triggers.push(event.trigger(name, fn))
    return this
  },
  off(name, fn) {
    this._triggers = mapFilter(this._triggers, event.filter(name, fn))
    return this
  },
}

exports.StateMixin = {
  get(path) {
    if (typeof path == 'string') {
      path = path.split('.')
    }
    let i = -1, prop, state = this._state
    while (true) {
      prop = path[++i]
      if (i == path.length - 1) {
        return state[prop]
      }
      state = state[prop]
      if (state == null) return
      if (state.constructor != Object) {
        path = path.slice(0, i + 1).join('.')
        throw TypeError(`'${path}' is not an object`)
      }
    }
  },
  set(path, value) {
    if (typeof path == 'string') {
      path = path.split('.')
    }
    if (this._validate && path.length == 1) {
      this._validate(value, path[0])
    }
    let i = -1, prop, state = this._state
    while (true) {
      prop = path[++i]
      if (i == path.length - 1) {
        state[prop] = value
        return this
      }
      const parent = state
      state = parent[prop]
      if (state == null) {
        parent[prop] = state = {}
      } else if (state.constructor != Object) {
        path = path.slice(0, i + 1).join('.')
        throw TypeError(`'${path}' is not an object`)
      }
    }
  },
  merge(path, vals) {
    let state

    if (arguments.length < 2) {
      vals = path
      path = []
    }
    if (vals == null) return
    if (vals.constructor != Object) {
      throw TypeError('Expected an object')
    }

    if (typeof path == 'string') {
      path = path.split('.')
    }
    if (path.length) {
      state = this.get(path)
      if (state == null) {
        this.set(path, vals)
        return this
      }
      if (state.constructor != Object) {
        path = path.join('.')
        throw TypeError(`'${path}' is not an object`)
      }
    } else {
      state = this._state
      if (this._validate) {
        mergeAndValidate(state, vals, this._validate)
        return this
      }
    }

    merge(state, vals, path)
    return this
  },
  delete(path) {
    if (typeof path == 'string') {
      path = path.split('.')
    }
    if (this._validate && path.length == 1) {
      if (!this._validate(undefined, path[0], false)) {
        throw Error(`'${path}' cannot be deleted`)
      }
    }
    let i = -1, prop, state = this._state
    while (true) {
      prop = path[++i]
      if (i == path.length - 1) {
        delete state[prop]
        return this
      }
      const parent = state
      state = parent[prop]
      if (state == null) return this
      if (state.constructor != Object) {
        path = path.slice(0, i + 1).join('.')
        throw TypeError(`'${path}' is not an object`)
      }
    }
  },
}

exports.TypeMixin = {
  on(name, fn) {
    this._triggers.push(event.trigger(name, fn))
  },
  extend(vals) {
    Object.assign(this.prototype, vals)
  },
}

//
// Helpers
//

// Validate the root level while merging.
function mergeAndValidate(dest, source, validate) {
  let prev, next, path
  for (let key in source) {
    next = source[key]
    if (next === undefined) continue
    validate(next, key)
    if (next === null || next.constructor != Object) {
      dest[key] = next
      continue
    }
    prev = dest[key]
    if (prev == null) {
      dest[key] = next
    } else if (prev.constructor == Object) {
      if (!path) path = [key]
      merge(prev, next, path)
    } else {
      throw TypeError(`'${key}' is not an object`)
    }
  }
}

function merge(dest, source, path) {
  let prev, next
  for (let key in source) {
    next = source[key]
    if (next === undefined) continue
    if (next === null || next.constructor != Object) {
      dest[key] = next
      continue
    }
    prev = dest[key]
    if (prev == null) {
      dest[key] = next
    } else if (prev.constructor == Object) {
      path.push(key)
      merge(prev, next, path)
      path.pop()
    } else {
      path = path.concat(key).join('.')
      throw TypeError(`'${path}' is not an object`)
    }
  }
}
