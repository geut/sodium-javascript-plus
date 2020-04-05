const modules = require('../sodium-modules')
const createImport = require('./create-import')

function loadSodiumWasm (sodiumJS, heap) {
  const sodium = {
    _original: {}
  }

  const importObj = createImport(sodiumJS, heap)
  const { env } = importObj

  modules.forEach(({ name, functions = {}, constants = {} }) => {
    try {
      const binary = Buffer.from(require('../build/' + name), 'base64')
      // const binary = require('fs').readFileSync(`${__dirname}/../build/${name}.wasm`)
      const { exports: wasmModule } = new WebAssembly.Instance(new WebAssembly.Module(binary), importObj)

      Object.keys(functions).forEach(fn => {
        sodium[fn] = wasmModule[fn]
      })
      Object.keys(constants).forEach(constant => {
        sodium[constants[constant]] = wasmModule[constant]()
        sodiumJS[constants[constant]] = wasmModule[constant]()
      })
      Object.keys(functions).forEach(fn => {
        env[fn] = wasmModule[fn]
      })
      Object.keys(constants).forEach(constant => {
        env[constant] = wasmModule[constant]
      })

      sodium._original[name] = wasmModule
    } catch (err) {
      throw new Error(`Error loading: ${name} - ${err.message}`)
    }
  })

  return sodium
}

module.exports = loadSodiumWasm
