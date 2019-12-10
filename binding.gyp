{
  'variables': {
    'target_arch%': '<!(node preinstall.js --print-arch)>'
  },
  'targets': [
    {
      'target_name': 'sodium',
      'conditions': [
        ['OS == "android" or OS == "ios"', {
          'sources': [
            'binding.cc',
            'src/crypto_hash_sha256_wrap.cc',
            'src/crypto_hash_sha512_wrap.cc',
            'src/crypto_generichash_wrap.cc',
            'src/crypto_onetimeauth_wrap.cc',
            'src/crypto_stream_xor_wrap.cc',
            'src/crypto_stream_chacha20_xor_wrap.cc',
            'src/crypto_secretstream_xchacha20poly1305_state_wrap.cc',
            'src/crypto_pwhash_async.cc',
            'src/crypto_pwhash_str_async.cc',
            'src/crypto_pwhash_str_verify_async.cc',
            'src/crypto_pwhash_scryptsalsa208sha256_async.cc',
            'src/crypto_pwhash_scryptsalsa208sha256_str_async.cc',
            'src/crypto_pwhash_scryptsalsa208sha256_str_verify_async.cc'
          ],
          'xcode_settings': {
            'OTHER_CFLAGS': [
              '-g',
              '-O3',
            ]
          },
          'cflags': [
            '-g',
            '-O3',
          ],
          'link_settings': {
            'libraries': [
              '-Wl,--enable-new-dtags',
              '-Wl,-rpath=\\$$ORIGIN'
            ]
          },
        }],
        ['OS == "android"', {
          'include_dirs' : [
            "<!(node -e \"require('nan')\")",
            'libsodium/src/libsodium/include'
          ],
          'libraries': [
            '<(module_root_dir)/lib/android-<(target_arch)/libsodium.so',
          ],
          'copies': [{
            'files': [
              '<(module_root_dir)/lib/android-<(target_arch)/libsodium.so',
            ],
            'destination': '<(PRODUCT_DIR)/',
          }],
        }],
        ['OS == "ios"', {
          'include_dirs' : [
            "<!(node -e \"require('nan')\")",
            'libsodium/libsodium-ios/include',
          ],
          'libraries': [
            '<(module_root_dir)/lib/ios/libsodium.so',
          ],
          'copies': [{
            'files': [
              '<(module_root_dir)/lib/ios/libsodium.so',
            ],
            'destination': '<(PRODUCT_DIR)/',
          }],
        }],
      ]
    }
  ],
}
