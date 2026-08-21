import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readCompanyPackOptIn, writeCompanyPackOptIn } from '../src/company-pack-opt-in.ts'

describe('company pack opt-in state', () => {
  it('defaults to disabled and only enables after an explicit write', () => {
    const dir = mkdtempSync(join(tmpdir(), 'company-pack-opt-in-'))
    try {
      expect(readCompanyPackOptIn(dir)).toBe(false)
      writeCompanyPackOptIn(dir, true)
      expect(readCompanyPackOptIn(dir)).toBe(true)
      writeCompanyPackOptIn(dir, false)
      expect(readCompanyPackOptIn(dir)).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
