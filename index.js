var sodium = require('bindings')({
  bindings: 'sodium.node',
  name: 'sodium-native-nodejs-mobile',
});

module.exports = sodium;
