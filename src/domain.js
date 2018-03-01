const {EventMixin, TypeMixin} = require('./mixins')
const {createClass, priv} = require('./utils')

class Domain {
  get count() {
    return this._state.size
  }
  get(id) {
    return this._state.get(id)
  }
  add(arg) {
    let id, item
    if (this._identify) {
      id = this._identify(arg)
      if (id != null) {
        item = this._state.get(id)
        if (item) return item
      }
    }
    item = this._spawn(arg)
    if (item) {
      if (id != null) {
        priv(item, '_id', id)
      }
      if (item._state) {
        priv(item, '_domain', this)
        if (id == null) {
          id = item._state.id
        }
      } else if (id == null) {
        id = item.id
      }
      if (id == null) {
        throw Error('Domain value has no identifier')
      }
      this._state.set(id, item)

      const event = {name: 'add'}
      event[item._type || 'object'] = item
      this.emit(event)

      return item
    } return null
  }
  remove(arg) {
    if (arg != null) {
      let id, item
      if (typeof arg == 'object') {
        item = arg
        id = item._id
        if (id == null) {
          id = item._state ? item._state.id : item.id
        }
      } else {
        id = arg
        item = this._state.get(arg)
      }
      if (item && item._domain == this) {
        item._domain = null
        this._state.delete(id)

        const event = {name: 'remove'}
        event[item._type || 'object'] = item
        this.emit(event)
      }
    }
  }
  empty() {
    this._state = new Map
  }
  each(fn) {
    this._state.forEach(fn)
  }
  map(fn) {
    const res = new Array(this._state.size)
    let i = -1; this._state.forEach(val => {
      res[++i] = fn(val, i)
    })
    return res
  }
  emit(event) {
    event.source = this
    this._box._emit(event)
  }
}

Object.assign(Domain.prototype, EventMixin)

module.exports = Domain

Domain.create = function(opts, box) {
  if (!opts.type)
    throw Error('`opts.type` must be defined')

  let init = opts.constructor
  if (init == Object) init = null

  const scope = {priv}, impl = [
    `var self = Object.create(ctr.prototype)`,
    `priv(self, '_state', new Map)`,
    `priv(self, '_triggers', [])`,
  ]

  if (init) {
    scope.init = init
    impl.push('init.call(self, opts)')
  }

  impl.push('return self')
  const type = createClass('Domain', ['opts'], impl, scope)

  const proto = type.prototype
  Object.setPrototypeOf(proto, Domain.prototype)
  proto._type = opts.type
  proto._box = box

  if (opts.spawn) {
    proto._spawn = opts.spawn
  } else {
    throw Error('`opts.spawn` must be defined')
  }

  if (opts.identify) {
    proto._identify = opts.identify
  }

  // Triggers used across instances.
  priv(type, '_triggers', [])

  Object.assign(type, TypeMixin)
  return type
}
