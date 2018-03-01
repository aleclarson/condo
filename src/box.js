const {EventMixin, StateMixin} = require('./mixins')
const Domain = require('./domain')
const Entity = require('./entity')
const schema = require('./schema')

// Used for microtask scheduling.
const tick = Promise.resolve()

class Box {
  constructor(opts = {}) {
    this.domain = this.domain.bind(this)
    this.entity = this.entity.bind(this)
    this._state = opts.state || {}
    this._triggers = []
    if (opts.schema) {
      this._validate = schema.build(opts.schema)
      for (let key in opts.schema) {
        this._validate(this._state[key], key)
      }
    }
  }
  domain(opts) {
    const {type} = opts
    if (this.domain[type] == null) {
      return this.domain[type] = Domain.create(opts, this)
    } throw Error(`Domain type already exists: '${type}'`)
  }
  entity(opts) {
    const {type} = opts
    if (this.entity[type] == null) {
      return this.entity[type] = Entity.create(opts, this)
    } throw Error(`Entity type already exists: '${type}'`)
  }
  emit(event) {
    event.source = this
    emit(this._triggers, this, event)
  }
  _emit(event) {
    const {name, source} = event
    if (typeof name != 'string') {
      throw Error('`event.name` must be a string')
    }
    tick.then(() => {
      // Source-level triggers
      emit(source._triggers, source, event)
      emit(source.constructor._triggers, source, event)

      // The domain and box expect the source type in the event name.
      event.name = source._type + ':' + name

      // Domain-level triggers
      const domain = source._domain
      if (domain && event.bubbles !== false) {
        emit(domain._triggers, domain, event)
        emit(domain.constructor._triggers, domain, event)
      }

      // Box-level triggers
      const box = source._box
      if (box && event.bubbles !== false) {
        emit(box._triggers, box, event)
      }
    }).catch(error => {
      if (name == 'error') {
        console.error(error.stack)
      } else {
        this._emit({
          name: 'error',
          source: this,
          event,
          error,
        })
      }
    })
  }
}

Object.assign(Box.prototype, EventMixin)
Object.assign(Box.prototype, StateMixin)

module.exports = Box

function emit(triggers, ctx, event) {
  if (triggers.length) {
    const {name} = event
    for (let i = 0, trigger; i < triggers.length; i++) {
      trigger = triggers[i]
      if (trigger.test(name)) {
        trigger.fn.call(ctx, event)
      }
    }
  }
}
