export declare function crypto_generichash(
  out: u32,
  outlen: u32,
  inn: u32,
  innlen: u32,
  key: u32,
  keylen: u32
): u32

export declare function crypto_generichash_update(
  state: u32,
  inn: u32,
  innlen: u32
): u32
