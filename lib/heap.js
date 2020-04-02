module.exports = class Memory {
  constructor () {
    this._offset = 0
  }

  setSodium (sodium) {
    this._heap = Buffer.from(sodium.memory.buffer)
    this._sodium = sodium
    this._malloc = sodium.malloc
  }

  memoryGrowth (buf) {
    if (this._heap) {
      const newHeap = Buffer.from(buf)
      newHeap.set(this._heap)
      this._heap = newHeap
      this._heap32 = new Uint32Array(this._heap)
      return
    }

    this._heap = Buffer.from(buf)
    this._heap32 = new Uint32Array(this._heap)
  }

  malloc (length) {
    const result = this._malloc(length)
    if (result === 0) {
      throw new Error(`_malloc() failed. length = ${length}`)
    }
    return result
  }

  set (bytes) {
    const address = this.malloc(bytes.length)
    this._heap.set(bytes, address)
    return { buffer: this._heap.slice(address, address + bytes.length), address }
  }

  alloc (length) {
    const address = this.malloc(length)
    return { buffer: this._heap.slice(address, address + length), address }
  }
}
