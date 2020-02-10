var sodium = require('bindings')({
  bindings: 'sodium.node',
  name: 'sodium-native',
});

module.exports = sodium;
