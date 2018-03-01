tp = require 'testpass'

{StateMixin} = require '../src/mixins'

node = Object.create StateMixin

reset = ->
  node._state = {}

tp.group 'set:', ->
  tp.beforeEach reset

  tp.test 'x = 1', (t) ->
    node.set 'x', 1
    t.eq node._state.x, 1

  tp.test 'x.y = 1', (t) ->
    node.set 'x.y', 1
    t.eq node._state.x.y, 1

  tp.test 'x.y.z = 1', (t) ->
    node.set 'x.y.z', 1
    t.eq node._state.x.y.z, 1

  tp.test 'throw if parent is not an object', (t) ->
    node.set 'x', []
    node.set 'x.y.z', 1
  .catch "'x' is not an object"

tp.group 'merge:', ->
  tp.beforeEach reset

  tp.test 'two shallow keys', (t) ->
    node.set 'x', 0
    node.merge {x: 1, y: 2}
    t.eq node._state.x, 1
    t.eq node._state.y, 2

  tp.test 'two deep keys', (t) ->
    node.set 'x', {y: 1}
    node.merge x: {y: 2, z: 3}
    t.eq node._state.x.y, 2
    t.eq node._state.x.z, 3

  tp.test 'two shallow objects', (t) ->
    node.set 'x', y: {z: 1}, z: {y: 1}
    node.merge x: {y: {z: 2}, z: {y: 2}}
    t.eq node._state.x.y.z, 2
    t.eq node._state.x.z.y, 2

  tp.test 'two deep objects', (t) ->
    node.set 'a', b: c: d: 1
    node.set 'b', c: d: e: 1
    node.merge
      a: b: c: d: 2
      b: c: d: e: 2
    t.eq node._state.a.b.c.d, 2
    t.eq node._state.b.c.d.e, 2

  tp.test 'replace object with non-object', (t) ->
    node.set 'x', {y: 1}
    node.merge x: 1
    t.eq node._state.x, 1

  tp.test 'throw if parent is not an object', (t) ->
    node.set 'x', 1
    node.merge x: y: 1
  .catch "'x' is not an object"

  tp.group 'dot notation:', ->

    tp.test 'two shallow objects', (t) ->
      node.set 'x.y.z', {a: 0}
      node.merge 'x.y.z', {a: 1, b: 1}
      t.eq node._state.x.y.z.a, 1
      t.eq node._state.x.y.z.b, 1

    tp.test 'throw if parent is not an object', (t) ->
      node.set 'x', 1
      node.merge 'x.y', z: 1
    .catch "'x' is not an object"

tp.group 'get:', ->
  tp.beforeEach reset

  tp.test '"x"', (t) ->
    node.set 'x', 1
    t.eq node.get('x'), 1

  tp.test '"x" undefined', (t) ->
    t.eq node.get('x'), undefined

  tp.test '"x.y"', (t) ->
    node.set 'x.y', 1
    t.eq node.get('x.y'), 1

  tp.test '"x.y" undefined', (t) ->
    t.eq node.get('x.y'), undefined

  tp.test '"x.y" non-object', (t) ->
    node.set 'x', 1
    node.get 'x.y'
  .catch "'x' is not an object"

tp.group 'delete:', ->
  tp.beforeEach reset

  tp.test '"x"', (t) ->
    node.set 'x', 1
    node.delete 'x'
    t.eq node._state.hasOwnProperty('x'), false

  tp.test '"x" undefined', (t) ->
    node.delete 'x'

  tp.test '"x.y"', (t) ->
    node.set 'x.y', 1
    node.delete 'x.y'
    t.eq node._state.x.hasOwnProperty('y'), false

  tp.test '"x.y" undefined', (t) ->
    node.delete 'x.y'

  tp.test '"x.y" non-object', (t) ->
    node.set 'x', 1
    node.delete 'x.y'
  .catch "'x' is not an object"
