export declare function crypto_aead_xchacha20poly1305_ietf_encrypt(
  c: u32,
  clen: u32,
  m: u32,
  mlen: u64,
  ad: u32,
  adlen: u64,
  nsec: u32,
  npub: u32,
  k: u32
): u32

export declare function crypto_aead_xchacha20poly1305_ietf_decrypt(
  m: u32,
  mlen: u32,
  nsec: u32,
  c: u32,
  clen: u64,
  ad: u32,
  adlen: u64,
  npub: u32,
  k: u32
): u32
