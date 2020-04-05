const fs = require('fs')
const path = require('path')

const BUILD_PATH = path.join(path.resolve(__dirname, '..'), 'build')

const bindingC = fs.readFileSync(path.join(BUILD_PATH, 'binding-c.wasm'))
const bindingJS = fs.readFileSync(path.join(BUILD_PATH, 'binding-js.wasm'))

fs.writeFileSync(path.join(BUILD_PATH, 'binding-c.js'), `module.exports = '${bindingC.toString('base64')}'`)
fs.writeFileSync(path.join(BUILD_PATH, 'binding-js.js'), `module.exports = '${bindingJS.toString('base64')}'`)
