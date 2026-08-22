import { describe, expect, it } from 'vitest'
import { EXAMPLE_COMPANY_IDENTITY, name } from '../src/index.ts'

describe('company example plugin', () => {
  it('exposes a stable Cordis name and SSO extension point without secrets', () => {
    expect(name).toBe('company-example')
    expect(EXAMPLE_COMPANY_IDENTITY.displayName).toBe('Example Company')
    expect(EXAMPLE_COMPANY_IDENTITY.organizationId).toBeUndefined()
    expect(JSON.stringify(EXAMPLE_COMPANY_IDENTITY)).not.toMatch(/secret|token|password|api[_-]?key/iu)
  })
})
