#!/bin/bash

echo "Building Metroidvania WASM game..."
wasm-pack build --target web --out-dir pkg

echo "Build complete! WASM files are in the 'pkg' directory."