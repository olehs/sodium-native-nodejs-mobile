var os = require('os')
var fs = require('fs')
var path = require('path')
var proc = require('child_process')
var ini = require('ini')

var release = path.join(__dirname, 'build/Release')
var debug = path.join(__dirname, 'build/Debug')
var tmp = path.join(__dirname, 'tmp')
var build = fs.existsSync(release) ? release : debug
var arch = process.env.ARCH || os.arch()

// switch (os.platform()) {
//   case 'win32':
//     buildWindows()
//     break

//   case 'darwin':
//     buildDarwin()
//     break

//   case 'freebsd':
//   case 'openbsd':
//   default:
//     buildUnix()
//     break
// }

if (process.env.PLATFORM_NAME === 'iphoneos') {
  buildIOS()
} else {
  buildAndroid('arm', () => {
    buildAndroid('arm64', () => {})
  })
}

function buildWindows () {
  var lib = path.join(__dirname, 'lib/libsodium-' + arch + '.dll')
  var dst = path.join(build, 'libsodium.dll')
  if (fs.existsSync(dst)) return
  copy(lib, dst, function (err) {
    if (err) throw err
  })
}

function buildUnix () {
  var lib = fs.realpathSync(path.join(__dirname, 'lib/libsodium-' + arch + '.so'))

  var la = ini.decode(fs.readFileSync(path.join(tmp, 'lib/libsodium.la')).toString())
  var dst = path.join(build, la.dlname)

  if (fs.existsSync(dst)) return
  copy(lib, dst, function (err) {
    if (err) throw err
  })
}

function buildDarwin () {
  var lib = path.join(__dirname, 'lib/libsodium-' + arch + '.dylib')
  var dst = path.join(build, 'libsodium.dylib')
  if (fs.existsSync(dst)) return
  copy(lib, dst, function (err) {
    if (err) throw err
    proc.exec('install_name_tool -id "@loader_path/libsodium.dylib" libsodium.dylib', { cwd: build }, function (err) {
      if (err) throw err
      proc.exec('install_name_tool -change "' + lib + '" "@loader_path/libsodium.dylib" sodium.node', { cwd: build }, function (err) {
        if (err) throw err
      })
    })
  })
}

function buildAndroid(arch, cb) {
  var libPath = path.join(__dirname, 'lib/android-' + arch, 'libsodium.so')
  if (!fs.existsSync(libPath)) {
    console.error('postinstall failed because expected a file to exist, ' +
    'but it does not exist: ' + libPath)
    return
  }
  var lib = fs.realpathSync(libPath)

  var la = ini.decode(fs.readFileSync(path.join(__dirname, 'libsodium/libsodium-android-armv7-a/lib/libsodium.la')).toString())
  var dst = path.join(build, la.dlname)

  mkdirSync(build)
  if (fs.existsSync(dst)) return
  copy(lib, dst, function (err) {
    if (err) throw err
    if (cb) cb()
  })
}

function buildIOS(cb) {
  var libPath = path.join(__dirname, 'lib/ios', 'libsodium.so')
  if (!fs.existsSync(libPath)) {
    console.error('postinstall failed because expected a file to exist, ' +
    'but it does not exist: ' + libPath)
    return
  }
  var lib = fs.realpathSync(libPath)
  var dst = path.join(build, 'libsodium.so')

  mkdirSync(build)
  if (fs.existsSync(dst)) return
  copy(lib, dst, function (err) {
    if (err) throw err
    if (cb) cb()
  })
}

function copy (a, b, cb) {
  fs.stat(a, function (err, st) {
    if (err) return cb(err)
    fs.readFile(a, function (err, buf) {
      if (err) return cb(err)
      fs.writeFile(b, buf, function (err) {
        if (err) return cb(err)
        fs.chmod(b, st.mode, cb)
      })
    })
  })
}

function mkdirSync (p) {
  try {
    fs.mkdirSync(p)
  } catch (err) {
    // do nothing
  }
}
