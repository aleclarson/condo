const {EventMixin, StateMixin, TypeMixin} = require('./mixins')
const {createClass, priv} = require('./utils')
const schema = require('./schema')

class Entity {
  emit(event) {
    event.source = this
    this._box._emit(event)
  }
}

Object.assign(Entity.prototype, EventMixin)
Object.assign(Entity.prototype, StateMixin)

module.exports = Entity

Entity.create = function(opts, box) {
  if (!opts.type)
    throw Error('`opts.type` must be defined')

  let init = opts.constructor
  if (init == Object) init = null

  const scope = {priv}, impl = [
    `var self = Object.create(ctr.prototype)`,
    `priv(self, '_state', ${init ? '{}' : 'seed || {}'})`,
    `priv(self, '_triggers', [])`,
  ]

  if (init) {
    scope.init = init
    impl.push('init.call(self, seed)')
  }

  let validate
  if (opts.schema) {
    const props = Object.keys(opts.schema)
    scope.validate = function(state) {
      for (let i = 0, prop; i < props.length; i++) {
        prop = props[i], validate(state[prop], prop)
      }
    }

    validate = schema.build(opts.schema)
    impl.push('validate(self._state)')
  }

  impl.push('return self')
  const type = createClass('Entity', ['seed'], impl, scope)

  const proto = type.prototype
  Object.setPrototypeOf(proto, Entity.prototype)
  proto._type = opts.type
  proto._box = box

  if (validate) {
    proto._validate = validate
  }

  // Triggers used across instances.
  priv(type, '_triggers', [])

  Object.assign(type, TypeMixin)
  return type
}
