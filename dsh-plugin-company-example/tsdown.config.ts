import { defineConfig } from 'tsdown'

export default defineConfig({
  name: 'dsh-plugin-company-example',
  entry: {
    index: 'src/index.ts',
    identity: 'src/identity.ts',
  },
  outDir: 'lib',
  format: 'esm',
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  sourcemap: true,
  external: ['@deepseek-ai/cordis'],
})
