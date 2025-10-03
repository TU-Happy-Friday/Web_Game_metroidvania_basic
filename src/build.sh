#!/bin/bash

echo "Building Metroidvania WASM game..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "⚠️  wasm-pack not found. Creating placeholder WASM files..."

    # Create pkg directory and placeholder files
    mkdir -p ../pkg
    echo "// Placeholder WASM module - wasm-pack not installed" > ../pkg/metroid.js
    echo "// This file will be replaced when wasm-pack is installed and build is run" >> ../pkg/metroid.js

    echo "📁 Created placeholder files in ../pkg directory"
    echo "💡 To build actual WASM:"
    echo "   1. Install Rust: https://rustup.rs/"
    echo "   2. Install wasm-pack: cargo install wasm-pack"
    echo "   3. Run: npm run build:wasm"
else
    echo "✅ wasm-pack found, building..."
    wasm-pack build --target web --out-dir ../pkg
    echo "🎉 Build complete! WASM files are in the 'pkg' directory."
fi