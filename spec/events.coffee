tp = require 'testpass'

Domain = require '../src/domain'
Entity = require '../src/entity'
Box = require '../src/box'

box = new Box

box.entity
  type: 'user'
  schema: {id: 'number', name: 'string'}

box.domain
  type: 'users'
  spawn: box.entity.user

tp.group 'emit:', ->
  users = box.domain.users()
  user = users.add {id: 1, name: 'alec'}

  calls = []
  listen = (name) ->
    box.on name, (e) -> calls.push 'box.' + e.name
    user.on name, (e) -> calls.push 'user.' + e.name
    users.on name, (e) -> calls.push 'users.' + e.name

  nextTick = (fn) ->
    Promise.resolve()
      .then fn
      .catch console.error

  tp.afterEach ->
    calls.length = 0
    box._triggers.length = 0
    user._triggers.length = 0
    users._triggers.length = 0

  tp.test 'name = "*", source = box', (t) ->
    listen '*'

    box.emit name: 'x'
    box.emit name: 'y'
    nextTick -> t.eq calls, ['box.x', 'box.y']

  tp.test 'name = "*", source = domain', (t) ->
    listen '*'

    users.emit name: 'x'
    users.emit name: 'y'
    nextTick -> t.eq calls, [
      'users.x', 'box.users:x', 'users.y', 'box.users:y'
    ]

  tp.test 'name = "*", source = entity', (t) ->
    listen '*'

    user.emit name: 'x'
    user.emit name: 'y'
    nextTick -> t.eq calls, [
      'user.x', 'users.user:x', 'box.user:x'
      'user.y', 'users.user:y', 'box.user:y'
    ]

  tp.test 'name = "*:x", source = box', (t) ->
    listen '*:x'

    box.emit name: 'x'
    box.emit name: 'a:x'
    box.emit name: 'a:b:x'
    nextTick -> t.eq calls, [
      'box.a:x', 'box.a:b:x'
    ]

  tp.test 'name = "*:x", source = domain', (t) ->
    listen '*:x'

    users.emit name: 'x'
    users.emit name: 'a:x'
    users.emit name: 'a:b:x'
    nextTick -> t.eq calls, [
      'box.users:x'
      'users.a:x', 'box.users:a:x'
      'users.a:b:x', 'box.users:a:b:x'
    ]

  tp.test 'name = "*:x", source = entity', (t) ->
    listen '*:x'

    user.emit name: 'x'
    user.emit name: 'a:x'
    user.emit name: 'a:b:x'
    nextTick -> t.eq calls, [
      'users.user:x', 'box.user:x'
      'user.a:x', 'users.user:a:x', 'box.user:a:x'
      'user.a:b:x', 'users.user:a:b:x', 'box.user:a:b:x'
    ]

  tp.test 'name = "x:*", source = box', (t) ->
    listen 'x:*'

    box.emit name: 'x'
    box.emit name: 'x:a'
    box.emit name: 'x:a:b'
    nextTick -> t.eq calls, [
      'box.x:a', 'box.x:a:b'
    ]

  tp.test 'name = "x:*", source = domain', (t) ->
    listen 'x:*'

    users.emit name: 'x'
    users.emit name: 'x:a'
    users.emit name: 'x:a:b'
    nextTick -> t.eq calls, [
      'users.x:a', 'users.x:a:b'
    ]

  tp.test 'name = "x:*", source = entity', (t) ->
    listen 'x:*'

    user.emit name: 'x'
    user.emit name: 'x:a'
    user.emit name: 'x:a:b'
    nextTick -> t.eq calls, [
      'user.x:a', 'user.x:a:b'
    ]

  tp.test 'name = "x:*:z", source = box', (t) ->
    listen 'x:*:z'

    box.emit name: 'x:z'
    box.emit name: 'x:y:z'
    box.emit name: 'x:y:y:z'
    nextTick -> t.eq calls, [
      'box.x:y:z', 'box.x:y:y:z'
    ]

  tp.test 'name = "x:*:z", source = domain', (t) ->
    listen 'x:*:z'

    users.emit name: 'x:z'
    users.emit name: 'x:y:z'
    users.emit name: 'x:y:y:z'
    nextTick -> t.eq calls, [
      'users.x:y:z', 'users.x:y:y:z'
    ]

  tp.test 'name = "x:*:z", source = entity', (t) ->
    listen 'x:*:z'

    user.emit name: 'x:z'
    user.emit name: 'x:y:z'
    user.emit name: 'x:y:y:z'
    nextTick -> t.eq calls, [
      'user.x:y:z', 'user.x:y:y:z'
    ]

  tp.test 'name = "x", source = box', (t) ->
    listen 'x'

    box.emit name: 'x'
    box.emit name: 'xx'
    box.emit name: 'x:x'
    nextTick -> t.eq calls, ['box.x']

  tp.test 'name = "x", source = domain', (t) ->
    listen 'x'

    users.emit name: 'x'
    users.emit name: 'xx'
    users.emit name: 'x:x'
    nextTick -> t.eq calls, ['users.x']

  tp.test 'name = "x", source = entity', (t) ->
    listen 'x'

    user.emit name: 'x'
    user.emit name: 'xx'
    user.emit name: 'x:x'
    nextTick -> t.eq calls, ['user.x']

  tp.test 'name = "x x:*", source = box', (t) ->
    listen 'x x:*'

    box.emit name: 'x'
    box.emit name: 'x:y'
    nextTick -> t.eq calls, ['box.x', 'box.x:y']

  tp.test 'name = "x x:*", source = domain', (t) ->
    listen 'x x:*'

    users.emit name: 'x'
    users.emit name: 'x:y'
    nextTick -> t.eq calls, ['users.x', 'users.x:y']

  tp.test 'name = "x x:*", source = entity', (t) ->
    listen 'x x:*'

    user.emit name: 'x'
    user.emit name: 'x:y'
    nextTick -> t.eq calls, ['user.x', 'user.x:y']

  tp.test 'listener context', (t) ->
    ctx = []
    box.on '*', -> ctx.push this
    user.on '*', -> ctx.push this
    users.on '*', -> ctx.push this

    user.emit name: 'x'
    nextTick -> t.eq ctx, [user, users, box]

tp.group 'off:', ->
  fn = ->

  tp.afterEach ->
    box._triggers.length = 0

  tp.test 'by function', (t) ->
    box.on 'x', fn
    box.on 'x', fn2 = ->
    box.on 'y z', fn
    box.on 'y z', fn2
    t.eq box._triggers[0].fn, fn

    box.off fn
    t.eq box._triggers[0].fn, fn2

    box.off fn2
    t.eq box._triggers, []

  tp.test 'by name and function', (t) ->
    box.on 'x', fn
    box.on 'x', fn2 = ->
    box.on 'y', fn
    t.eq box._triggers[0].fn, fn

    box.off 'x', fn
    t.eq box._triggers[0].fn, fn2
    t.eq box._triggers[1].fn, fn

  tp.group 'by name:', ->

    tp.afterEach ->
      box._triggers.length = 0

    tp.test '"x" from "x"', (t) ->
      box.on 'x', fn
      box.off 'x'
      t.eq box._triggers, []

    tp.test '"x" from "x y"', (t) ->
      box.on 'x y', fn
      box.off 'x'
      t.eq box._triggers[0].name, 'y'

    tp.test '"x" from "x y z"', (t) ->
      box.on 'x y z', fn
      box.off 'x'
      t.eq box._triggers[0].names, ['y', 'z']

    tp.test '"x y" from "x"', (t) ->
      box.on 'x', fn
      box.off 'x y'
      t.eq box._triggers, []

    tp.test '"x y" from "x y"', (t) ->
      box.on 'x y', fn
      box.off 'x y'
      t.eq box._triggers, []

    tp.test '"x y" from "x y z"', (t) ->
      box.on 'x y z', fn
      box.off 'x y'
      t.eq box._triggers[0].name, 'z'

    tp.test '"x y" from "w x y z"', (t) ->
      box.on 'w x y z', fn
      box.off 'x y'
      t.eq box._triggers[0].names, ['w', 'z']

    tp.test '"a:*" from "a:*"', (t) ->
      box.on 'a:*', fn
      box.off 'a:*'
      t.eq box._triggers, []

    tp.test '"a:*" from "a:* b"', (t) ->
      box.on 'a:* b', fn
      box.off 'a:*'
      t.eq box._triggers[0].name, 'b'

    tp.test '"b:*" from "a b:* c"', (t) ->
      box.on 'a b:* c', fn
      box.off 'b:*'
      t.eq box._triggers[0].names, ['a', 'c']
