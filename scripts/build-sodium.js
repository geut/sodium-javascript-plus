const { promises: fs } = require('fs')
const path = require('path')
const execa = require('execa')
const binaryen = require('binaryen')

const ROOT_PATH = path.resolve(__dirname, '..')
const LIBSODIUM_PATH = path.resolve(ROOT_PATH, 'libsodium')
const LIBSODIUM_JS_PATH = path.join(LIBSODIUM_PATH, 'libsodium-js')
const LIBSODIUM_SOURCE_PATH = path.join(LIBSODIUM_PATH, 'src', 'libsodium')
const BUILD_PATH = path.join(ROOT_PATH, 'build')
const DEBUG = process.argv.includes('--debug')

// MEMORY USAGE
const STACK_SIZE = 128 * 1024 // 128 kb / lib.o
const TOTAL_MEMORY = 16777216 // (bytes) === 256 pages of 65 kb

const DEFAULT_LDFLAGS = [
  'RESERVED_FUNCTION_POINTERS=8',
  'ASSERTIONS=0',
  'AGGRESSIVE_VARIABLE_ELIMINATION=1',
  'ALIASING_FUNCTION_POINTERS=1',
  'DISABLE_EXCEPTION_CATCHING=1',
  'ERROR_ON_UNDEFINED_SYMBOLS=0',
  `TOTAL_STACK=${STACK_SIZE}`
]

const modules = require('../sodium-modules')

if (DEBUG) {
  binaryen.setOptimizeLevel(0)
  binaryen.setShrinkLevel(0)
  binaryen.setDebugInfo(true)
} else {
  binaryen.setOptimizeLevel(3)
  binaryen.setShrinkLevel(2)
}

;(async () => {
  if (!await exists(LIBSODIUM_JS_PATH)) {
    await buildSodium()
  }

  // const toCompile = [
  //   compileToWASM({
  //   core: true,
  //   to: 'all.wasm',
  //   functions: [
  //   'crypto_stream_chacha20_ietf_ext',
  //   'crypto_stream_chacha20_ietf_ext_xor_ic',
  //   'crypto_core_hchacha20',
  //   'crypto_onetimeauth_poly1305_final',
  //   'crypto_onetimeauth_poly1305_init',
  //   'crypto_onetimeauth_poly1305_update',
  //   'crypto_aead_xchacha20poly1305_ietf_decrypt',
  //   'crypto_aead_xchacha20poly1305_ietf_encrypt',
  //   'crypto_aead_xchacha20poly1305_ietf_keybytes',
  //   'crypto_aead_xchacha20poly1305_ietf_npubbytes',
  //   'crypto_aead_xchacha20poly1305_ietf_nsecbytes',
  //   'crypto_aead_xchacha20poly1305_ietf_abytes'
  //   ]
  //   })
  // ]

  let memoryBase = 1024

  for (const cryptoModule of modules) {
    memoryBase = await compileToWASM(memoryBase, cryptoModule)
  }

  console.log(`Your AssemblyScript build must go with: --memoryBase ${memoryBase}`)
})()

const execaOpts = { shell: true, cwd: LIBSODIUM_PATH, stdout: process.stdout, stderr: process.stderr }

async function exists (path) {
  try {
    await fs.access(path)
    return true
  } catch (err) {
    return false
  }
}

async function buildSodium () {
  if (!await exists(path.join(LIBSODIUM_PATH, 'configure'))) {
    await execa('sh', ['autogen.sh'], execaOpts)
  }

  await execa('emconfigure', [
    './configure',
    '--enable-minimal',
    '--disable-shared',
   `--prefix=${LIBSODIUM_JS_PATH}`,
   '--without-pthreads',
   '--disable-ssp',
   '--disable-asm',
   '--disable-pie',
   'CFLAGS=-Os'
  ], execaOpts)
  await execa('emmake', ['make', 'clean'], execaOpts)
  await execa('emmake', ['make', '-j4', 'install'], execaOpts)
}

async function compileToWASM (memoryBase, { lib, name, functions = {}, constants = {} }) {
  console.log(`\n- compiling ${name}\n`)

  const binaryPath = path.join(BUILD_PATH, `${name}.wasm`)
  const base64Path = path.join(BUILD_PATH, `${name}.js`)

  const EXPORTED_FUNCTIONS = Object.keys(functions).concat(Object.keys(constants)).map(f => `"_${f}"`).join(',')

  const args = [
    '-s GLOBAL_BASE=' + memoryBase,
    `-s EXPORTED_FUNCTIONS='[${EXPORTED_FUNCTIONS}]'`,
    `-o ${binaryPath}`
  ].reduce((prev, curr) => {
    return [...prev, ...curr.split(' ')]
  }, [])

  DEFAULT_LDFLAGS.forEach(flag => {
    args.push('-s')
    args.push(flag)
  })

  if (DEBUG) {
    args.push('-g4')
    args.push('-O1')
  } else {
    args.push('--llvm-lto')
    args.push('1')
    args.push('-Oz')
  }

  await execa('emcc', [
    ...args,
    ...lib.map(file => path.join(LIBSODIUM_SOURCE_PATH, file))
  ], execaOpts)

  const wasmModule = binaryen.readBinary(await fs.readFile(binaryPath))

  memoryBase = updateMemory(memoryBase, wasmModule)

  const binary = wasmModule.emitBinary()

  await fs.writeFile(binaryPath, binary)
  await fs.writeFile(base64Path, `module.exports = '${Buffer.from(wasmModule.emitBinary()).toString('base64')}'`)

  if (DEBUG) {
    await fs.writeFile(path.join(BUILD_PATH, `${name}.wat`), wasmModule.emitText())
  }

  return memoryBase
}

// This function is the only way I find to import the memory and get __head_base from a STANDALONE_WASM file compiled by emscripten
async function updateMemory (memoryBase, wasmModule) {
  wasmModule.addMemoryImport('mem', 'env', 'memory')
  wasmModule.removeExport('memory')

  let offset = memoryBase
  for (let i = 0; i < wasmModule.getNumMemorySegments(); i++) {
    offset += wasmModule.getMemorySegmentInfoByIndex(i).offset - offset
  }

  wasmModule.optimize()

  return offset + STACK_SIZE
}
