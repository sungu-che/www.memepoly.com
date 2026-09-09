import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

var ROOT = path.dirname(fileURLToPath(import.meta.url))
var LEGACY_GLOBALS = ["mapgen.js", "sfx.js"]

function legacyGlobals(){
    return {
        name : "memepoly-legacy-globals",
        apply : "build",
        generateBundle(){
            for(var i = 0; i < LEGACY_GLOBALS.length; i++){
                var name = LEGACY_GLOBALS[i]
                var from = path.resolve(ROOT, "src", name)
                if(!fs.existsSync(from)){
                    this.error("legacy global not found :: " + from)
                    return
                }
                this.emitFile({
                    type : "asset",
                    fileName : "src/" + name,
                    source : fs.readFileSync(from, "utf-8")
                })
                console.log("[build] legacy global emitted :: src/" + name)
            }
        }
    }
}

export default defineConfig({
  server: {
    host: true,
  },
  resolve: {
    alias: [
      {
        find: /^gl-noise$/,
        replacement: 'gl-noise/build/glNoise.m.js'
      }
    ]
  },
  plugins: [react(),legacyGlobals()],
  build: {
    chunkSizeWarningLimit: 1600,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom')
          ) {
            return 'vendor-react'
          }
          if (
            id.includes('node_modules/three') ||
            id.includes('node_modules/@react-three')
          ) {
            return 'vendor-three'
          }
        },
      },
    },
  },
})