# sodium-native-nodejs-mobile

This is a fork of [sodium-native](https://github.com/sodium-friends/sodium-native) specifically meant to work with [nodejs-mobile](https://github.com/janeasystems/nodejs-mobile) only, by cross-compiling to targets such as Android arm and Android arm64 and iOS arm64.

## Supports

- Version 2.4.2
- Android
- iOS

## Diff

The changes made from sodium-native to sodium-native-nodejs-mobile are:

- No prebuilds, it cross-compiles to Android and/or iOS upon npm install
- Use `configure-mobile` instead of `configure`
- Using `bindings` instead of `node-gyp-build` to load the native bindings
- Does not support other operating systems other than Android and iOS
- We patch the build script for iOS, to exclude Simulator architectures and armv7

## Versioning

We will follow the convention of having the same SemVer code as the official sodium-native, but with a suffix `-X` (where `X` is a number). For instance, `sodium-native-nodejs-mobile@2.4.2-3` is the `3`rd version of this library that is equivalent to `sodium-native@2.4.2`.


## License

MIT
