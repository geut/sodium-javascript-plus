import * as sodiumJS from './sodium-js'

export function crypto_generichash(
  out: u32,
  outlen: u32,
  inn: u32,
  innlen: u64,
  key: u32,
  keylen: u32
): u32 {
  return sodiumJS.crypto_generichash(out, outlen, inn, u32(innlen), key, keylen);
}

export function crypto_generichash_update(
  state: u32,
  inn: u32,
  innlen: u64
): u32 {
  return sodiumJS.crypto_generichash_update(state, inn, u32(innlen));
}
