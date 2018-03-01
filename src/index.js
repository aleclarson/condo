const Box = require('./box')

module.exports = {
  box(schema) {
    return new Box(schema)
  }
}
