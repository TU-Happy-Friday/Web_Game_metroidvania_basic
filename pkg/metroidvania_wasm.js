export default async function init() {
  throw new Error('WASM module not built. Run `npm run build:wasm` to compile the engine.');
}

export class GameWrapper {
  constructor() {
    throw new Error('WASM module not built. Run `npm run build:wasm` to compile the engine.');
  }

  update() {
    // no-op placeholder
  }

  render() {
    // no-op placeholder
  }

  handle_key_down() {
    // no-op placeholder
  }

  handle_key_up() {
    // no-op placeholder
  }
}

throw new Error('WASM module not built. Run `npm run build:wasm` to compile the engine.');
