const crypto = require('crypto')
const { WASI } = require('@wasmer/wasi')

const wasi = new WASI({
  args: [],
  env: {},
  bindings: require('@wasmer/wasi/lib/bindings/node').default
})

function vn (x, xi, y, yi, n) {
  var i; var d = 0
  for (i = 0; i < n; i++) d |= x[xi + i] ^ y[yi + i]
  return (1 & ((d - 1) >>> 8)) - 1
}

const wasmMemory = new WebAssembly.Memory({
  initial: 16777216 / 65536
})

var wasmTable = new WebAssembly.Table({
  initial: 1,
  maximum: 1 + 8,
  element: 'anyfunc'
})

// const defaultImportObj = {
// env: {
// abortStackOverflow: () => { throw new Error('overflow') },
// table: new WebAssembly.Table({ initial: 0, maximum: 0, element: 'anyfunc' }),
// tableBase: 0,
// memoryBase: 1024,
// STACKTOP: 0,
// emscripten_asm_const_iii () {
// var buf = crypto.randomBytes(4)
// return (buf[0] << 24 | buf[1] << 16 | buf[2] << 8 | buf[3]) >>> 0
// },
// sodium_memzero (...args) {
// console.log(...args)
// },
// crypto_verify_16 (x, xi, y, yi) {
// return vn(x, xi, y, yi, 16)
// },
// randombytes_buf () {}
// },
// a: {
// memory: new WebAssembly.Memory({ initial: 10, maximum: 100 }),
// a: () => {}
// }
// env: {
// crypto_verify_16 (x, xi, y, yi) {
// return vn(x, xi, y, yi, 16)
// },
// emscripten_notify_memory_growth () {}
// }
// }

function loadWasm (buf, heap) {
  let instance
  const importObj = {
    env: {
      memory: wasmMemory,
      emscripten_asm_const_iii () {
        var buf = crypto.randomBytes(4)
        return (buf[0] << 24 | buf[1] << 16 | buf[2] << 8 | buf[3]) >>> 0
      },
      crypto_verify_16 (x, xi, y, yi) {
        return vn(x, xi, y, yi, 16)
      },
      emscripten_notify_memory_growth () {
        if (instance) {
          heap.update(wasmMemory.buffer)
        }
      }
    }
  }
  const module = new WebAssembly.Module(buf)
  instance = new WebAssembly.Instance(module, {
    ...importObj,
    ...wasi.getImports(module)
  })
  heap.update(wasmMemory.buffer)
  heap.setSodium(instance.exports)
  return instance
}

module.exports = loadWasm
