import { describe, expect, it, vi } from 'vitest'
import {
  assertCompanyPackConfirmed,
  cascadeCompanyPackInstall,
} from '../src/install.ts'
import {
  COMPANY_PACK_CHILDREN,
  COMPANY_PACK_COMMUNITY_RECOMMENDATIONS,
  COMPANY_PACK_PACKAGE_NAME,
  buildCompanyPackInstallPlan,
} from '../src/manifest.ts'

describe('company pack install plan', () => {
  it('lists pack, bundled children, and community recommendations for confirm UI', () => {
    const plan = buildCompanyPackInstallPlan()
    expect(plan.pack.packageName).toBe(COMPANY_PACK_PACKAGE_NAME)
    expect(plan.companyChildren.map(entry => entry.packageName)).toEqual(
      COMPANY_PACK_CHILDREN.map(child => child.packageName),
    )
    expect(plan.communityRecommendations.map(entry => entry.packageName)).toEqual(
      COMPANY_PACK_COMMUNITY_RECOMMENDATIONS.map(plugin => plugin.packageName),
    )
    expect(plan.entries.map(entry => entry.kind)).toEqual([
      'pack',
      'company-child',
      'community',
      'community',
    ])
  })

  it('does not embed secrets in the example pack metadata', () => {
    expect(JSON.stringify(buildCompanyPackInstallPlan())).not.toMatch(
      /secret|token|password|api[_-]?key/iu,
    )
  })
})

describe('company pack cascade', () => {
  it('refuses installs without explicit confirmation', () => {
    expect(() => assertCompanyPackConfirmed({ confirmed: false })).toThrow(/confirmation/u)
    expect(() => assertCompanyPackConfirmed({})).toThrow(/confirmation/u)
  })

  it('enables the pack then serially installs community targets after confirm', async () => {
    const order: string[] = []
    const result = await cascadeCompanyPackInstall(
      {
        enableBundledPack: async () => { order.push('pack') },
        installCommunityPlugin: async (target) => {
          order.push(`${target.packageName}@${target.packageVersion}`)
        },
      },
      {
        confirmed: true,
        communityTargets: [
          { packageName: 'dsh-better-sidebar', packageVersion: '1.2.3', receiptId: 'r1' },
          { packageName: 'dsh-context', packageVersion: '2.0.0', receiptId: 'r2' },
        ],
      },
    )
    expect(order).toEqual([
      'pack',
      'dsh-better-sidebar@1.2.3',
      'dsh-context@2.0.0',
    ])
    expect(result.packEnabled).toBe(true)
    expect(result.communityInstalled).toEqual(['dsh-better-sidebar', 'dsh-context'])
  })

  it('rejects non-recommended or non-exact community targets', async () => {
    const deps = {
      enableBundledPack: vi.fn(async () => undefined),
      installCommunityPlugin: vi.fn(async () => undefined),
    }
    await expect(cascadeCompanyPackInstall(deps, {
      confirmed: true,
      communityTargets: [
        { packageName: 'evil-plugin', packageVersion: '1.0.0', receiptId: 'r1' },
      ],
    })).rejects.toThrow(/non-recommended/u)
    await expect(cascadeCompanyPackInstall(deps, {
      confirmed: true,
      communityTargets: [
        { packageName: 'dsh-context', packageVersion: 'latest', receiptId: 'r1' },
      ],
    })).rejects.toThrow(/SemVer/u)
    expect(deps.enableBundledPack).not.toHaveBeenCalled()
    expect(deps.installCommunityPlugin).not.toHaveBeenCalled()
  })
})
