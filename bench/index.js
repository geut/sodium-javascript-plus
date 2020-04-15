const bench = require('nanobench')
const sodiumNative = require('sodium-native')
const sodiumWrappers = require('libsodium-wrappers')
const sodiumJS = require('..')

sodiumWrappers.ready.then(() => {
  bench('sodiumNative xchacha20poly1305 (encrypt/decrypt) 200.000 times', function (b) {
    b.start()

    for (var i = 0; i < 200000; i++) {
      xchacha20poly1305(sodiumNative)
    }

    b.end()
  })

  bench('sodiumWrappers xchacha20poly1305 (encrypt/decrypt) 200.000 times', function (b) {
    b.start()

    for (var i = 0; i < 200000; i++) {
      const message = Buffer.from(
        '4c616469657320616e642047656e746c656d656e206f662074686520636c6173' +
              '73206f66202739393a204966204920636f756c64206f6666657220796f75206f' +
              '6e6c79206f6e652074697020666f7220746865206675747572652c2073756e73' +
              '637265656e20776f756c642062652069742e',
        'hex'
      )
      const ad = Buffer.from('50515253c0c1c2c3c4c5c6c7', 'hex')
      const nonce = Buffer.from('404142434445464748494a4b4c4d4e4f5051525354555657', 'hex')
      const key = Buffer.from('808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f', 'hex')

      const cipher = sodiumWrappers.crypto_aead_xchacha20poly1305_ietf_encrypt(
        message,
        ad,
        null,
        nonce,
        key
      )

      const decrypted = sodiumWrappers.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        cipher,
        ad,
        nonce,
        key
      )

      if (!Buffer.from(decrypted).equals(message)) {
        throw new Error('wrong')
      }
    }

    b.end()
  })

  bench('sodiumJS xchacha20poly1305 (encrypt/decrypt) 200.000 times', function (b) {
    b.start()

    for (var i = 0; i < 200000; i++) {
      xchacha20poly1305(sodiumJS)
    }

    b.end()
  })
})

function xchacha20poly1305 (sodium) {
  const message = Buffer.from(
    '4c616469657320616e642047656e746c656d656e206f662074686520636c6173' +
          '73206f66202739393a204966204920636f756c64206f6666657220796f75206f' +
          '6e6c79206f6e652074697020666f7220746865206675747572652c2073756e73' +
          '637265656e20776f756c642062652069742e',
    'hex'
  )
  const ad = Buffer.from('50515253c0c1c2c3c4c5c6c7', 'hex')
  const nonce = Buffer.from('404142434445464748494a4b4c4d4e4f5051525354555657', 'hex')
  const key = Buffer.from('808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f', 'hex')
  const cipher = Buffer.alloc(message.length + sodium.crypto_aead_xchacha20poly1305_ietf_ABYTES)

  sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    cipher,
    message,
    ad,
    null,
    nonce,
    key
  )

  const decrypted = Buffer.alloc(message.length)

  sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    decrypted,
    null,
    cipher,
    ad,
    nonce,
    key
  )

  if (!decrypted.equals(message)) {
    throw new Error('wrong')
  }
}
