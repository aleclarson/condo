
const globRE = /\*:/g
const globEndRE = /:\*(\s|$)/g

exports.trigger = createTrigger
exports.filter = filterTriggers

function createTrigger(name, fn) {
  let self

  // Match all
  if (name == '*') {
    self = /./
    self.name = name
  } else {
    const isArray = Array.isArray(name)

    // Glob matching
    if (isArray ? contains(name, isGlob) : isGlob(name)) {
      self = globRegex(name, isArray)
    }

    // Many exact matches
    else if (isArray || ~name.indexOf(' ')) {
      self = {
        names: isArray ? name : name.split(' '),
        test: testNames,
      }
    }

    // One exact match
    else {
      self = {name, test: testName}
    }
  }

  self.fn = fn
  return self
}

// Create a filter function for removing triggers.
function filterTriggers(name, fn) {

  // Removed triggers must use the given function.
  if (typeof name == 'function') {
    return fn = name, (trig) => trig.fn == fn ? null : trig
  }

  let filter

  // Remove all triggers for any of the given names.
  if (~name.indexOf(' ')) {
    const arr = name.split(' ')
    filter = (trig) => {
      let {names} = trig
      if (names) {
        names = names.filter(arrayDiff, arr)
        if (names.length) {
          if (names.length == 1) {
            return createTrigger(names[0], trig.fn)
          }
          if (trig.constructor == RegExp) {
            return createTrigger(names, trig.fn)
          }
          trig.names = names
          return trig
        }
      }
      else if (arr.indexOf(trig.name) < 0) {
        return trig
      }
    }
  }

  // Remove all triggers for the given name.
  else {
    filter = (trig) => {
      const {names} = trig
      if (names) {
        const idx = names.indexOf(name)
        if (~idx) {
          if (names.length == 2) {
            return createTrigger(names[1 - idx], trig.fn)
          }
          names.splice(idx, 1)
          if (trig.constructor == RegExp) {
            return createTrigger(names, trig.fn)
          }
        }
        return trig
      }
      if (trig.name !== name) {
        return trig
      }
    }
  }

  // Removed triggers must use the given function.
  if (typeof fn == 'function') {
    return (trig) => trig.fn == fn ? filter(trig) : trig
  }
  return filter
}

function contains(arr, fn) {
  for (let i = 0; i < arr.length; i++) {
    if (fn(arr[i], i)) return true
  }
  return false
}

function isGlob(glob) {
  return glob.indexOf('*') > -1
}

function globRegex(glob, isArray) {
  let regex
  if (isArray) {
    regex = glob.map(globReplace).join('|')
  } else if (~glob.indexOf(' ')) {
    regex = globReplace(glob).replace(/\s/g, '|')
  } else {
    regex = new RegExp('^' + globReplace(glob) + '$')
    regex.name = glob
    return regex
  }
  regex = new RegExp('^(?:' + regex + ')$')
  regex.names = isArray ? glob : glob.split(' ')
  return regex
}

function globReplace(glob) {
  return glob
    .replace(globEndRE, '(?::[^:]+)*\\:[^:]+$1')
    .replace(globRE, '(?:[^:]+:)*[^:]+:')
}

function testNames(str) {
  return this.names.indexOf(str) > -1
}

function testName(str) {
  return this.name === str
}

// Remove items that exist in both arrays.
function arrayDiff(val) {
  return this.indexOf(val) < 0
}
