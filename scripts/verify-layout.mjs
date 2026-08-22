import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readFileSync, readlinkSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const readJson = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const run = (command, args, cwd = root) => execFileSync(command, args, {
  cwd,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
}).trim()
const fail = message => { throw new Error(`verify-layout: ${message}`) }

const workspace = readJson('package.json')
const upstream = readJson('upstream.json')
const plugin = readJson('dsh-plugin-desktop/package.json')
const fabric = readJson('dsh-community-fabric/package.json')
const market = readJson('dsh-community-market/package.json')
const upstreamPackage = readJson('deepseek-harness/package.json')

if (workspace.packageManager !== 'yarn@4.18.0') {
  fail('the product workspace must pin yarn@4.18.0')
}
if (JSON.stringify(workspace.workspaces) !== JSON.stringify([
  'dsh-plugin-desktop',
  'dsh-community-fabric',
  'dsh-community-market',
  'dsh-plugin-company-pack',
])) {
  fail('the root Yarn workspace must contain the desktop, community-fabric, community-market, and company-pack packages')
}
const companyPack = readJson('dsh-plugin-company-pack/package.json')
for (const [name, manifest] of [
  ['dsh-plugin-desktop', plugin],
  ['dsh-community-fabric', fabric],
  ['dsh-community-market', market],
  ['dsh-plugin-company-pack', companyPack],
]) {
  if (manifest.packageManager !== undefined) fail(`${name} must inherit the root Yarn release`)
}
if (fabric.name !== 'dsh-community-fabric') fail('the Fabric workspace must own dsh-community-fabric')
if (market.name !== 'dsh-community-market') fail('the market workspace must own dsh-community-market')
if (companyPack.name !== 'dsh-plugin-company-pack') fail('the Company Pack workspace must own dsh-plugin-company-pack')
if (plugin.dependencies?.['dsh-plugin-company-pack'] !== companyPack.version) {
  fail('desktop must depend on the workspace Company Pack version so it ships in the packaged app graph')
}
if (typeof companyPack.dependencies?.['dsh-plugin-company-example'] !== 'string'
  || !String(companyPack.dependencies['dsh-plugin-company-example']).includes('dsh-plugin-company-example')) {
  fail('Company Pack must depend on the external dsh-plugin-company-example package')
}
if (typeof plugin.dependencies?.['dsh-plugin-company-example'] !== 'string'
  || !String(plugin.dependencies['dsh-plugin-company-example']).includes('dsh-plugin-company-example')) {
  fail('desktop must depend on the external dsh-plugin-company-example package')
}
if (existsSync(resolve(root, 'dsh-plugin-company-example'))) {
  fail('dsh-plugin-company-example must not remain an in-repo workspace package')
}
{
  const patch = readFileSync(resolve(root, 'dsh-plugin-desktop/cordis.patch.yml'), 'utf8')
  if (/name:\s*dsh-plugin-company-pack\b/u.test(patch)) {
    fail('desktop cordis.patch.yml must not default-insert the Company Pack (opt-in only)')
  }
  if (!patch.includes('dsh-plugin-desktop/company-pack-install')) {
    fail('desktop cordis.patch.yml must register the Company Pack install bridge')
  }
  if (!patch.includes('dsh-plugin-company-example')) {
    fail('desktop cordis.patch.yml must always insert company-example so its Settings hub loads')
  }
}
const claudePath = resolve(root, 'CLAUDE.md')
const claudeStat = lstatSync(claudePath)
// Windows checkouts materialize the symlink as a regular file holding the
// target name; accept both forms so the pointer stays verified on every host.
const claudeTarget = claudeStat.isSymbolicLink()
  ? readlinkSync(claudePath)
  : readFileSync(claudePath, 'utf8').trim()
if (claudeTarget !== 'AGENTS.md') {
  fail('CLAUDE.md must link to the outer repository AGENTS.md')
}
for (const legacyFile of [
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'dsh-plugin-desktop/pnpm-lock.yaml',
  'dsh-plugin-desktop/pnpm-workspace.yaml',
  'dsh-community-fabric/pnpm-lock.yaml',
  'dsh-community-fabric/pnpm-workspace.yaml',
  'dsh-community-market/pnpm-lock.yaml',
  'dsh-community-market/pnpm-workspace.yaml',
]) {
  if (existsSync(resolve(root, legacyFile))) fail(`${legacyFile} must not exist`)
}
if (run('git', ['config', '-f', '.gitmodules', '--get', 'submodule.deepseek-harness.path']) !== 'deepseek-harness') {
  fail('the upstream submodule path must be deepseek-harness')
}
if (run('git', ['config', '-f', '.gitmodules', '--get', 'submodule.deepseek-harness.url']) !== upstream.repository) {
  fail('the upstream submodule URL differs from upstream.json')
}
if (typeof upstreamPackage.packageManager !== 'string' || !upstreamPackage.packageManager.startsWith('pnpm@')) {
  fail('the upstream checkout must retain its pnpm package manager')
}

for (const [owner, manifest] of [
  ['root', workspace],
  ['desktop', plugin],
  ['fabric', fabric],
  ['market', market],
  ['company-pack', companyPack],
  ['company-example', companyExample],
]) {
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'resolutions']) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      if (typeof range !== 'string') continue
      if (/^(?:workspace|portal|link):/u.test(range)
        || (range.startsWith('file:') && range.includes('deepseek-harness'))) {
        fail(`${owner} ${field}.${name} bypasses the published DSH package boundary`)
      }
    }
  }
}

const [mode, object] = run('git', ['ls-files', '--stage', '--', 'deepseek-harness']).split(/\s+/u)
if (mode !== '160000') fail('deepseek-harness must be tracked as a Git submodule')
if (object !== upstream.commit) fail(`submodule index is ${object}, expected ${upstream.commit}`)

const upstreamDir = resolve(root, 'deepseek-harness')
if (run('git', ['rev-parse', 'HEAD'], upstreamDir) !== upstream.commit) {
  fail('checked-out upstream commit differs from upstream.json')
}
if (run('git', ['status', '--porcelain'], upstreamDir) !== '') {
  fail('deepseek-harness contains local changes')
}
if (run('git', ['remote', 'get-url', 'origin'], upstreamDir) !== upstream.repository) {
  fail('deepseek-harness origin differs from upstream.json')
}
if (upstreamPackage.version !== upstream.sourceVersion) {
  fail('deepseek-harness package version differs from upstream.json')
}
for (const name of Object.keys(plugin.dependencies).filter(name => name === '@deepseek-ai/dsh' || name.startsWith('@deepseek-ai/dsh-'))) {
  if (plugin.dependencies[name] !== upstream.runtimePackageVersion) {
    fail(`${name} must use the recorded DSH runtime package family`)
  }
}

process.stdout.write(`verify-layout: Yarn workspace and upstream ${upstream.commit.slice(0, 10)} are consistent\n`)
