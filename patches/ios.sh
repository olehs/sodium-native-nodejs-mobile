#! /bin/sh

export PREFIX="$(pwd)/libsodium-ios"
export IOS64_PREFIX="$PREFIX/tmp/ios64"
export XCODEDIR=$(xcode-select -p)

export IOS_SIMULATOR_VERSION_MIN=${IOS_SIMULATOR_VERSION_MIN-"9.0.0"}
export IOS_VERSION_MIN=${IOS_VERSION_MIN-"9.0.0"}

mkdir -p $IOS64_PREFIX || exit 1

if [ -z "$LIBSODIUM_FULL_BUILD" ]; then
  export LIBSODIUM_ENABLE_MINIMAL_FLAG="--enable-minimal"
else
  export LIBSODIUM_ENABLE_MINIMAL_FLAG=""
fi


NPROCESSORS=$(getconf NPROCESSORS_ONLN 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null)
PROCESSORS=${NPROCESSORS:-3}

# Build for iOS
export BASEDIR="${XCODEDIR}/Platforms/iPhoneOS.platform/Developer"
export PATH="${BASEDIR}/usr/bin:$BASEDIR/usr/sbin:$PATH"
export SDK="${BASEDIR}/SDKs/iPhoneOS.sdk"

## 64-bit iOS
export CFLAGS="-fembed-bitcode -O2 -arch arm64 -isysroot ${SDK} -mios-version-min=${IOS_VERSION_MIN} -fembed-bitcode"
export CPPFLAGS="-fembed-bitcode -O2 -arch arm64 -isysroot ${SDK} -mios-version-min=${IOS_VERSION_MIN} -fembed-bitcode"
export LDFLAGS="-fembed-bitcode -arch arm64 -isysroot ${SDK} -mios-version-min=${IOS_VERSION_MIN} -fembed-bitcode"

make distclean > /dev/null

./configure --host=arm-apple-darwin10 \
            --disable-shared \
            ${LIBSODIUM_ENABLE_MINIMAL_FLAG} \
            --prefix="$IOS64_PREFIX" || exit 1

make -j${PROCESSORS} install || exit 1

# Create universal binary and include folder
rm -fr -- "$PREFIX/include" "$PREFIX/libsodium.a" 2> /dev/null
mkdir -p -- "$PREFIX/lib"
lipo -create \
  "$IOS64_PREFIX/lib/libsodium.a" \
  -output "$PREFIX/lib/libsodium.a"
mv -f -- "$IOS64_PREFIX/include" "$PREFIX/"

echo
echo "libsodium has been installed into $PREFIX"
echo
file -- "$PREFIX/lib/libsodium.a"

# Cleanup
rm -rf -- "$PREFIX/tmp"
make distclean > /dev/null
