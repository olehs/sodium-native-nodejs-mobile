var sodium = require('bindings')({
  bindings: 'sodium.node',
  name: 'sodium-native-no-prebuild'
})

module.exports = sodium
