import { defineConfig } from 'tsdown'

export default defineConfig({
  name: 'dsh-plugin-company-pack',
  entry: {
    index: 'src/index.ts',
    install: 'src/install.ts',
    manifest: 'src/manifest.ts',
  },
  outDir: 'lib',
  format: 'esm',
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  sourcemap: true,
  external: ['@deepseek-ai/cordis', 'dsh-plugin-company-example'],
})
