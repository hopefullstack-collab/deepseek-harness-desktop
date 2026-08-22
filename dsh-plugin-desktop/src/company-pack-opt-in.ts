/** Persist Company Pack opt-in outside cordis.patch.yml so the pack stays optional. */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const STATE_VERSION = 1
const STATE_FILE = 'company-pack-opt-in.json'

interface CompanyPackOptInState {
  readonly version: number
  readonly enabled: boolean
  readonly enabledAt?: string
}

function statePath(userDataDir: string): string {
  return join(userDataDir, 'company-pack', STATE_FILE)
}

/** Read whether the user confirmed Company Pack installation. */
export function readCompanyPackOptIn(userDataDir: string): boolean {
  try {
    const raw = JSON.parse(readFileSync(statePath(userDataDir), 'utf8')) as CompanyPackOptInState
    return raw.version === STATE_VERSION && raw.enabled === true
  } catch {
    return false
  }
}

/** Persist explicit user confirmation. Never called from silent launch. */
export function writeCompanyPackOptIn(userDataDir: string, enabled: boolean): void {
  const path = statePath(userDataDir)
  mkdirSync(dirname(path), { recursive: true })
  const state: CompanyPackOptInState = enabled
    ? { version: STATE_VERSION, enabled: true, enabledAt: new Date().toISOString() }
    : { version: STATE_VERSION, enabled: false }
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`)
}
