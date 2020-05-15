const sodium = require('..')

test('aead_chacha20poly1305', () => {
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
  const cipher = Buffer.alloc(message.length + sodium.crypto_aead_chacha20poly1305_ietf_ABYTES)

  sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
    cipher,
    message,
    ad,
    null,
    nonce,
    key
  )

  const decrypted = Buffer.alloc(message.length)

  sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
    decrypted,
    null,
    cipher,
    ad,
    nonce,
    key
  )

  expect(message.equals(decrypted)).toBe(true)
})

test('aead_xchacha20poly1305', () => {
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

  expect(cipher.toString('hex') === 'bd6d179d3e83d43b9576579493c0e939572a1700252bfaccbe' +
  'd2902c21396cbb731c7f1b0b4aa6440bf3a82f4eda7e39ae64c6708c54c216cb96b72e1213b4522f8c9b' +
  'a40db5d945b11b69b982c1bb9e3f3fac2bc369488f76b2383565d3fff921f9664c97637da9768812f615' +
  'c68b13b52ec0875924c1c7987947deafd8780acf49').toBe(true)

  const decrypted = Buffer.alloc(message.length)

  sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    decrypted,
    null,
    cipher,
    ad,
    nonce,
    key
  )

  expect(message.equals(decrypted)).toBe(true)
})

test('crypto_kx', () => {
  const clientPk = Buffer.alloc(sodium.crypto_kx_PUBLICKEYBYTES)
  const clientSk = Buffer.alloc(sodium.crypto_kx_SECRETKEYBYTES)
  const serverPk = Buffer.alloc(sodium.crypto_kx_PUBLICKEYBYTES)
  const serverSk = Buffer.alloc(sodium.crypto_kx_SECRETKEYBYTES)

  const serverRx = Buffer.alloc(sodium.crypto_kx_SESSIONKEYBYTES)
  const serverTx = Buffer.alloc(sodium.crypto_kx_SESSIONKEYBYTES)

  const clientRx = Buffer.alloc(sodium.crypto_kx_SESSIONKEYBYTES)
  const clientTx = Buffer.alloc(sodium.crypto_kx_SESSIONKEYBYTES)

  sodium.crypto_kx_keypair(serverPk, serverSk)
  sodium.crypto_kx_keypair(clientPk, clientSk)

  sodium.crypto_kx_client_session_keys(clientRx, clientTx, clientPk, clientSk, serverPk)
  sodium.crypto_kx_server_session_keys(serverRx, serverTx, serverPk, serverSk, clientPk)

  expect(clientRx.equals(serverTx)).toBe(true)
  expect(clientTx.equals(serverRx)).toBe(true)

  const pk = Buffer.alloc(sodium.crypto_kx_PUBLICKEYBYTES)
  const sk = Buffer.alloc(sodium.crypto_kx_SECRETKEYBYTES)
  const seed = Buffer.alloc(sodium.crypto_kx_SEEDBYTES, 'lo')

  sodium.crypto_kx_seed_keypair(pk, sk, seed)

  const eSk = '768475983073421d5b1676c4aabb24fdf17c3a5f19e6e9e9cdefbfeb45ceb153'
  const ePk = '0cd703bbd6b1d46dc431a1fc4f1f7724c64b1d4c471e8c17de4966c9e15bf85e'

  expect(pk.toString('hex')).toBe(ePk)
  expect(sk.toString('hex')).toBe(eSk)
})
