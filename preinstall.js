#!/usr/bin/env node

var fs = require('fs')
var os = require('os')
var proc = require('child_process')
var path = require('path')
var ini = require('ini')

var dir = path.join(__dirname, 'libsodium')
var tmp = path.join(__dirname, 'tmp')
var arch = process.env.PREBUILD_ARCH || os.arch()

if (process.argv.indexOf('--arch') > -1) {
  arch = process.argv[process.argv.indexOf('--arch') + 1]
}

var warch = arch === 'x64' ? 'x64' : 'Win32'

if (process.argv.indexOf('--print-arch') > -1) {
  console.log(arch)
  process.exit(0)
}

if (process.argv.indexOf('--print-lib') > -1) {
  switch (os.platform()) {
    case 'darwin':
      console.log('../lib/libsodium-' + arch + '.dylib')
      break
    case 'openbsd':
    case 'freebsd':
    case 'linux':
      console.log(path.join(__dirname, 'lib/libsodium-' + arch + '.so'))
      break
    case 'win32':
      console.log('../libsodium/Build/ReleaseDLL/' + warch + '/libsodium.lib')
      break
    default:
      process.exit(1)
  }

  process.exit(0)
}

mkdirSync(path.join(__dirname, 'lib'))

// switch (os.platform()) {
//   case 'darwin':
//     buildDarwin()
//     break

//   case 'win32':
//     buildWindows()
//     break

//   default:
//     buildUnix('so', function (err) {
//       if (err) throw err
//     })
//     break
// }

if (process.env.PLATFORM_NAME === 'iphoneos') {
  buildIOS()
} else {
  buildAndroid('arm', () => {
    buildAndroid('arm64', () => {})
  })
}

function findMsBuild () {
  var possiblePathSuffixes = [
    '/Microsoft Visual Studio/2017/BuildTools/MSBuild/15.0/Bin/msbuild.exe',
    '/Microsoft Visual Studio/2017/Enterprise/MSBuild/15.0/Bin/msbuild.exe',
    '/Microsoft Visual Studio/2017/Professional/MSBuild/15.0/Bin/msbuild.exe',
    '/Microsoft Visual Studio/2017/Community/MSBuild/15.0/Bin/msbuild.exe',
    '/MSBuild/14.0/Bin/MSBuild.exe',
    '/MSBuild/12.0/Bin/MSBuild.exe'
  ]

  // First try X86 paths (on 64 bit machine which is most likely) then 32 bit
  var possiblePaths = possiblePathSuffixes.map(p => process.env['PROGRAMFILES(X86)'] + p)
    .concat(possiblePathSuffixes.map(p => process.env['PROGRAMFILES'] + p))

  possiblePaths.push(process.env.WINDIR + '/Microsoft.NET/Framework/v4.0.30319/MSBuild.exe')

  for (var counter = 0; counter < possiblePaths.length; counter++) {
    var possiblePath = path.resolve(possiblePaths[counter])
    try {
      fs.accessSync(possiblePath)
      return possiblePath
    } catch (error) {
      // Binary not found checking next path
    }
  }

  console.error('MSBuild not found')
  console.error('You can run "npm install --global --production windows-build-tools" to fix this.')

  process.exit(1)
}

function buildWindows () {
  var res = path.join(__dirname, 'lib/libsodium-' + arch + '.dll')
  if (fs.existsSync(res)) return

  spawn('.\\msvc-scripts\\process.bat', [], { cwd: dir, stdio: 'inherit' }, function (err) {
    if (err) throw err
    var msbuild = findMsBuild()
    var args = ['/p:Configuration=ReleaseDLL;Platform=' + warch, '/nologo']
    spawn(msbuild, args, { cwd: dir, stdio: 'inherit' }, function (err) {
      if (err) throw err

      var dll = path.join(dir, 'Build/ReleaseDLL/' + warch + '/libsodium.dll')

      fs.rename(dll, res, function (err) {
        if (err) throw err
      })
    })
  })
}

function buildUnix (ext, cb) {
  var res = path.join(__dirname, 'lib/libsodium-' + arch + '.' + ext)
  if (fs.existsSync(res)) return cb(null, res)

  spawn('./configure', ['--prefix=' + tmp], { cwd: __dirname, stdio: 'inherit' }, function (err) {
    if (err) throw err
    spawn('make', ['clean'], { cwd: dir, stdio: 'inherit' }, function (err) {
      if (err) throw err
      spawn('make', ['install'], { cwd: dir, stdio: 'inherit' }, function (err) {
        if (err) throw err

        var la = ini.decode(fs.readFileSync(path.join(tmp, 'lib/libsodium.la')).toString())

        var lib = fs.realpathSync(path.join(la.libdir, la.dlname))
        fs.rename(lib, res, function (err) {
          if (err) throw err
          if (cb) cb(null, res)
        })
      })
    })
  })
}

function buildDarwin () {
  buildUnix('dylib', function (err, res) {
    if (err) throw err
    spawn('install_name_tool', ['-id', res, res], { stdio: 'inherit' }, function (err) {
      if (err) throw err
    })
  })
}

function buildAndroid(arch, cb) {
  mkdirSync(path.join(__dirname, 'lib/android-' + arch))
  var res = path.join(__dirname, 'lib/android-' + arch, 'libsodium.so')
  if (fs.existsSync(res)) return

  var buildScript =
    arch === 'arm' ? 'android-armv7-a.sh' :
    arch === 'arm64' ? 'android-armv8-a.sh' :
    ':'
  var outputDir =
    arch === 'arm' ? 'libsodium/libsodium-android-armv7-a/lib' :
    arch === 'arm64' ? 'libsodium/libsodium-android-armv8-a/lib' :
    '.'

  spawn('./configure-mobile', [], { cwd: __dirname, stdio: 'inherit' }, function (err) {
    if (err) throw err
    spawn('./dist-build/' + buildScript, [], { cwd: path.resolve(__dirname, 'libsodium'), stdio: 'inherit', env: {...process.env, LIBSODIUM_FULL_BUILD: 'yes'} }, function (err) {
      if (err) throw err

      var la = ini.decode(fs.readFileSync(path.resolve(__dirname, outputDir, 'libsodium.la')).toString())

      var lib = fs.realpathSync(path.join(la.libdir, la.dlname))
      fs.rename(lib, res, function (err) {
        if (err) throw err
        if (cb) cb()
      })
    })
  })
}

function buildIOS(cb) {
  mkdirSync(path.join(__dirname, 'lib/ios'))
  var res = path.join(__dirname, 'lib/ios', 'libsodium.so')
  var outputDir = 'libsodium/libsodium-ios/lib';
  if (fs.existsSync(res)) return

  spawn('./configure-mobile', [], { cwd: __dirname, stdio: 'inherit' }, function (err) {
    if (err) throw err

    // Patch ./dist-build/ios.sh
    var replacementBuildScript = path.join(__dirname, 'patches/ios.sh')
    var targetBuildScript = path.join(__dirname, 'libsodium/dist-build/ios.sh')
    fs.copyFileSync(replacementBuildScript, targetBuildScript)

    spawn('./dist-build/ios.sh', [], { cwd: path.resolve(__dirname, 'libsodium'), stdio: 'inherit', env: {...process.env, LIBSODIUM_FULL_BUILD: 'yes'} }, function (err) {
      if (err) throw err

      var lib = fs.realpathSync(path.resolve(__dirname, outputDir, 'libsodium.a'))
      fs.rename(lib, res, function (err) {
        if (err) throw err
        if (cb) cb()
      })
    })
  })
}

function spawn (cmd, args, opts, cb) {
  var c = proc.spawn(cmd, args, opts)
  c.on('exit', function (code) {
    if (code) return cb(new Error(cmd + ' exited with ' + code))
    cb(null)
  })
}

function mkdirSync (p) {
  try {
    fs.mkdirSync(p)
  } catch (err) {
    // do nothing
  }
}
