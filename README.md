# condo v0.0.1

Simple, event-based state wrappers with incremental schema validation.

```js
let app = condo.box()

app.domain({
  type: 'users',
  spawn: app.entity({
    type: 'user',
    schema: {
      id: 'number',
      name: 'string',
    }
  })
})

let users = app.domain.users()

users.on('add', console.log)

let user = users.add({
  id: 1,
  name: 'Ron Burgundy',
})

users.get(1) === user // => true

users.remove(1)
```

There are 3 object types in condo:
- `Box` the root-level state container
- `Entity` a powerful state wrapper
- `Domain` an entity container

The `Entity` and `Domain` types are meant to be subclassed using
  the `box.entity` and `box.domain` methods. Once created, you can
  construct your subclass using its "type" name like so:

```js
let user = box.entity.user(opts)
let users = box.domain.users(opts)
```

The great thing about domains is their ability to construct
  entities implicitly using the `spawn` option:

```js
box.domain({
  type: 'foo',
  spawn(arg) {
    if (typeof arg == 'string') {
      return box.entity.thing(arg)
    }
    throw Error('Expected a string!')
  }
})

let foo = box.domain.foo()
let thing = foo.add('hello world')
```

By default, all domain values must have an `id` property, but
  you can use the `identify` option for deriving identifiers
  from each value:

```js
box.domain({
  type: 'foo',
  spawn: box.entity.thing,
  identify(arg) {
    // `arg` is the same value passed to `spawn`.
    // If you return falsy, `entity.get('id')` is used.
    // The returned identifier is cached internally.
  }
})
```

Use the `constructor` option with `box.entity` or `box.domain`
  if you want to initialize each instance.

```js
box.domain({
  type: 'foo',
  spawn: box.entity({
    type: 'thing',
    constructor(arg) {
      // Called on each entity instance.
    }
  }),
  constructor(opts) {
    // Called on each domain instance.
  }
})
```

---

### State wrappers

The `Box` and `Entity` types wrap an internal state object
  to provide powerful controls.

The `get`, `set`, `merge`, and `delete` methods allow for
  easy path-based data access/mutation. This means dot-notation
  is supported.

The `get` method will never throw, preferring to return
  `undefined` if a path does not exist.

The `set`, `merge`, and `delete` methods will throw if a parent
  path is defined but not an object. If a parent path is null
  or undefined, the `set` method will avoid an error by creating
  a new object, and the `merge` method will avoid the extra work
  of cloning by simply using the given parent object.

The `set`, `merge`, and `delete` methods are chainable.

---

### The event system

The `on`, `off`, and `emit` methods exist on all `Box`, `Domain`,
  and `Entity` objects for driving event-based reactions.

Within the event system, there is a sort of pseudo-bubbling where
  a domain can listen to the events of its children and the box can
  listen to the events of any descendant.

When an entity emits an event, its own listeners are called first.
  If a parent domain exists, its listeners are called. And finally,
  the box's listeners are called.

When the box or domain receives an entity event, the event name
  always begins with the entity type and a colon.

```js
users.on('user:load', (event) => {
  // Called when a user entity emits a 'load' event.
})
```

Similarly, when the box receives a domain event, the event name
  always begins with the domain type and a colon.

```js
box.on('users:add', (event) => {
  // Called when a users domain emits an 'add' event.
})
```

Event objects always have the following properties:
- `name: string`
- `source: entity|domain|box`

When calling `emit`, you can add any properties you want
  to the event object.

```js
user.emit({
  name: 'error',
  error: new Error(),
})
```

The built-in "add" and "remove" domain events always include
  the entity, which is accessible using the entity type name.

```js
users.on('add', (event) => {
  event.user // => [object Entity]
})
```

The event system embraces colon-separated event names. This style
  allows for useful namespacing and event globbing.

Valid event patterns include:
- `*` all events
- `foo` one event
- `foo:*` events that begin with `foo:`
- `*:foo` events that end with `:foo`

You can listen to multiple event patterns with space separation.

```js
box.on('foo bar:*', (event) => {
  console.log(event.name)
})
```

There are 3 ways to remove a listener:

```js
// Stop listening for 'bar:*'
box.off('bar:*')

// Stop a specific listener of 'bar:*'
box.off('bar:*', fn)

// Stop a specific listener
box.off(fn)
```

The event pattern is searched for as-is, so `bar:*` would not
  remove a listener of `bar:foo`.

You can remove multiple event patterns with space separation.

For listeners of multiple event patterns, removing one pattern
  does not affect the other patterns.

#### Shared listeners

When creating a `Domain` or `Entity` type, you can attach listeners
  that will be reused across all instances.

```js
// Log 'add' events for all 'users' domain instances.
box.domain.users.on('add', console.log)
```

Shared listeners are not removable.

Shared listeners are called after instance-specific listeners.

---

### The `schema` option

Both the `Box` and `Entity` classes have a `schema` option
  for strict type validation of state.

The word "nullish" is used to describe both null and undefined.

The following values are valid types:
- `any` any value except nullish
- `array` uses `Array.isArray`
- `boolean`
- `date`
- `error`
- `false`
- `function`
- `int` a round number
- `number`
- `null`
- `object` an object literal or `Object.create(null)`
- `promise` an object with a `then` method
- `regexp`
- `string`
- `symbol`
- `true`
- `uint` a positive, round number

You can append `?` to the end of any type to allow nullish values.

You can specify multiple types using the `|` separator.

You can use uppercase strings (eg: `Uint8Array`) to validate
  against a global class. Currently, the type must be accessible
  from the `window` object.

All number types protect against NaN.

The `date`, `error`, and `object` types use `Object.prototype.toString`
  to validate value types. So your custom error types should always
  evaluate to `[object Error]` when called with `toString`.

Custom data types will be supported in the future.

The validator function created from the `schema` object is a collection
  of switch cases glued together with `new Function` for optimal performance.
  It's reused between instances of the same `Entity` type as the `_validate`
  method. The same name is used for `Box` objects with schemas.

```js
// Set `throws` to false to prevent exceptions, else leave it blank.
box._validate(value, key, throws)
```

The `set` and `merge` methods check the schema when updating values.
  An error is thrown when a value's type is invalid. Currently, only
  root-level keys can be validated, so you must create another Entity
  type if you want to validate an object within another entity.

The `delete` method will throw if the given key exists in the schema
  without a trailing `?`.
