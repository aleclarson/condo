tp = require 'testpass'

###
- `add` method
- `remove` method
- `spawn` option
- with plain objects (instead of entities)
- shared listeners
- "add" event
- "remove" event
###

condo = require ".."

box = condo.box()
box.entity type: 'foo'
box.entity type: 'bar'
box.domain
  type: 'test'
  spawn: (o) -> o

dom = box.domain.test()

tp.group '"spawn" option:', ->

  tp.afterEach ->
    dom.empty()

  tp.test 'may equal an entity type', (t) ->
    dom._spawn = box.entity.foo

    foo1 = dom.add id: 1
    t.eq foo1._type, 'foo'
    t.eq dom._state.get(1), foo1

    foo2 = dom.add id: 2
    t.eq foo2._type, 'foo'
    t.eq dom._state.get(2), foo2

  tp.test 'may use duck-typing', (t) ->
    dom._spawn = (o) ->
      return box.entity.foo o if o.x
      return box.entity.bar o if o.y

    foo = dom.add id: 1, x: 1
    t.eq foo._type, 'foo'
    t.eq dom._state.get(1), foo

    bar = dom.add id: 2, y: 1
    t.eq bar._type, 'bar'
    t.eq dom._state.get(2), bar

  tp.test 'may return falsy', (t) ->
    dom._spawn = (o) ->
      return false if o.x
      return null if o.y

    # Null is always returned for falsy spawns.
    t.eq dom.add(x: 1), null
    t.eq dom.add(y: 1), null
    t.eq dom.count, 0

  tp.test 'may throw', (t) ->
    dom._spawn = -> throw Error "bad value"
    dom.add x: 1
  .catch "bad value"

tp.group ->

  tp.beforeAll ->
    dom._spawn = box.entity.foo

  tp.afterEach ->
    dom.empty()

  tp.test 'remove by id', (t) ->

    dom.add id: 1
    t.eq dom.count, 1

    dom.remove 1
    t.eq dom.count, 0

  tp.test 'remove by object', (t) ->

    obj = dom.add id: 1
    t.eq dom.count, 1

    dom.remove obj
    t.eq dom.count, 0

  tp.group ->

    tp.afterEach ->
      dom._triggers = []
      dom.constructor._triggers = []

    tp.test '"add" event', (t) ->
      calls = []
      dom.on 'add', (e) -> calls.push e.foo
      o1 = dom.add id: 1
      o2 = dom.add id: 2
      Promise.resolve().then ->
        t.eq calls, [o1, o2]

    tp.test '"remove" event', (t) ->
      calls = []
      dom.on 'remove', (e) -> calls.push e.foo
      o1 = dom.get 1
      o2 = dom.get 2
      dom.remove o1
      dom.remove o2
      Promise.resolve().then ->
        t.eq calls, [o1, o2]

    tp.test 'shared listeners', (t) ->
      calls = 0
      box.domain.test.on 'add', -> calls++

      dom.add id: 1
      Promise.resolve().then ->
        t.eq calls, 1

      dom2 = box.domain.test()
      dom2.add id: 1
      Promise.resolve().then ->
        t.eq calls, 2

  tp.test 'may contain non-entity values', (t) ->
    dom._spawn = (o) -> o

    o = id: 1
    t.eq dom.add(o), o
