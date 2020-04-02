const { promises: fs } = require('fs')
const path = require('path')
const execa = require('execa')
const binaryen = require('binaryen')

const ROOT_PATH = path.resolve(__dirname, '..')
const LIBSODIUM_PATH = path.resolve(ROOT_PATH, 'libsodium')
const LIBSODIUM_JS_PATH = path.join(LIBSODIUM_PATH, 'libsodium-js')
const LIBSODIUM_SOURCE_PATH = path.join(LIBSODIUM_PATH, 'src', 'libsodium')
const BUILD_PATH = path.join(ROOT_PATH, 'build')
const DEFAULT_LDFLAGS = [
  'RESERVED_FUNCTION_POINTERS=8',
  'ASSERTIONS=0',
  'AGGRESSIVE_VARIABLE_ELIMINATION=1',
  'ALIASING_FUNCTION_POINTERS=1',
  'DISABLE_EXCEPTION_CATCHING=1',
  'ERROR_ON_UNDEFINED_SYMBOLS=0'
]
const OPTIMIZATION = '-Oz' // (low) O1 -> O2 -> O3 -> Os -> Oz (high)

;(async () => {
  if (!await exists(LIBSODIUM_JS_PATH)) {
    await buildSodium()
  }

  await Promise.all([
    compileToWASM({
      from: ['sodium/libsodium_la-core.o'],
      to: 'core.wasm',
      functions: ['_sodium_misuse']
    }),
    compileToWASM({
      from: ['crypto_onetimeauth/poly1305/libsodium_la-onetimeauth_poly1305.o', 'crypto_onetimeauth/poly1305/donna/libsodium_la-poly1305_donna.o'],
      to: 'onetimeauth_poly1305.wasm',
      functions: ['_crypto_onetimeauth_poly1305_final', '_crypto_onetimeauth_poly1305_init', '_crypto_onetimeauth_poly1305_update']
    }),
    compileToWASM({
      from: ['crypto_core/hchacha20/libsodium_la-core_hchacha20.o'],
      to: 'core_hchacha20.wasm',
      functions: ['_crypto_core_hchacha20']
    }),
    compileToWASM({
      from: ['crypto_stream/chacha20/libsodium_la-stream_chacha20.o', 'crypto_stream/chacha20/ref/libsodium_la-chacha20_ref.o'],
      to: 'stream_chacha20.wasm',
      functions: ['_crypto_stream_chacha20_ietf_ext', '_crypto_stream_chacha20_ietf_ext_xor_ic']
    }),
    compileToWASM({
      from: ['crypto_aead/xchacha20poly1305/sodium/libsodium_la-aead_xchacha20poly1305.o'],
      to: 'aead_xchacha20poly1305.wasm',
      functions: ['_crypto_aead_xchacha20poly1305_ietf_decrypt', '_crypto_aead_xchacha20poly1305_ietf_encrypt', '_crypto_aead_xchacha20poly1305_ietf_keybytes', '_crypto_aead_xchacha20poly1305_ietf_npubbytes', '_crypto_aead_xchacha20poly1305_ietf_nsecbytes']
    })
  ])
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

async function compileToWASM ({ from, to, functions }) {
  const args = [
    '-s',
    `EXPORTED_FUNCTIONS='[${functions.map(f => `"${f}"`).join(',')}]'`,
    '--llvm-lto',
    '1',
    OPTIMIZATION,
    '-o',
    path.join(BUILD_PATH, to)
  ]

  DEFAULT_LDFLAGS.forEach(flag => {
    args.push('-s')
    args.push(flag)
  })

  await execa('emcc', [
    ...args,
    ...from.map(file => path.join(LIBSODIUM_SOURCE_PATH, file))
  ], execaOpts)

  await addImportMemory(path.join(BUILD_PATH, to))
}

async function addImportMemory (binaryPath) {
  const myModule = binaryen.readBinary(await fs.readFile(binaryPath))
  myModule.addMemoryImport('mem', 'env', 'memory')
  myModule.removeExport('memory')
  await fs.writeFile(binaryPath, myModule.emitBinary())
}
