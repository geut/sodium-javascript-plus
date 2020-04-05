import * as sodiumC from './sodium-c'

export function crypto_aead_xchacha20poly1305_ietf_encrypt(
  c: u32,
  clen: u32,
  m: u32,
  mlen: u32,
  ad: u32,
  adlen: u32,
  nsec: u32,
  npub: u32,
  k: u32
): u32 {
  return sodiumC.crypto_aead_xchacha20poly1305_ietf_encrypt(c, clen, m, u64(mlen), ad, u64(adlen), nsec, npub, k)
}

export function crypto_aead_xchacha20poly1305_ietf_decrypt(
  m: u32,
  mlen: u32,
  nsec: u32,
  c: u32,
  clen: u32,
  ad: u32,
  adlen: u32,
  npub: u32,
  k: u32
): u32 {
  return sodiumC.crypto_aead_xchacha20poly1305_ietf_decrypt(m, mlen, nsec, c, u64(clen), ad, u64(adlen), npub, k)
}

export const INT32ARRAY_ID = idof<Int32Array>();
