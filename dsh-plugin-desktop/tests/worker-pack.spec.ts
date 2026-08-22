import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { en, zh } from '../src/client/locales.ts'
import {
  COMPANY_EXAMPLE_SETTINGS_SECTION_ID,
  COMPANY_PACK_PACKAGE_NAME,
  COMPANY_PACK_RECOMMENDED_ENTRY,
  DESKTOP_BUILTIN_PLUGINS_TAB_ID,
  DESKTOP_CURATED_PLUGINS_TAB_ID,
  DESKTOP_DEFAULT_AGENT_PRESET,
  DESKTOP_ENTERPRISE_PLUGINS_TAB_ID,
  DESKTOP_INTERNAL_MARKET_TAB_ID,
  DESKTOP_PLUGIN_SETTINGS_TAB_IDS,
  DESKTOP_WORKBENCH_PAGE_IDS,
  buildCompanyPackInstallPlan,
  desktopAgentPresetConfig,
  findCatalogItemForPackage,
  isWorkerPackRecommendedPackage,
  OFFICE_IM_RECOMMENDED_PLUGINS,
  recommendedPackageInstalled,
  recommendedPluginsFor,
  summarizeWorkerPackInstallResults,
  WORKER_PACK_CATALOG_SOURCE_KEY,
  WORKBENCH_LATER_RECOMMENDED_PLUGINS,
  WORKER_PACK_RECOMMENDED_PLUGINS,
  workerPackBlocksCommunityPackage,
  workerPackCatalogSelected,
} from '../src/worker-pack.ts'

describe('desktop worker pack', () => {
  it('overrides the upstream standard preset default with code', () => {
    expect(DESKTOP_DEFAULT_AGENT_PRESET).toBe('code')
    expect(desktopAgentPresetConfig({ default: 'standard', includeUserRoot: true })).toEqual({
      default: 'code',
      includeUserRoot: true,
    })
  })

  it('recommends workspace plugins without pinning unaudited versions', () => {
    expect(WORKER_PACK_RECOMMENDED_PLUGINS.map(plugin => plugin.packageName)).toEqual([
      'dsh-better-sidebar',
      'dsh-context',
    ])
    expect(WORKER_PACK_CATALOG_SOURCE_KEY).toBe('dsh-1024store')
    expect(WORKBENCH_LATER_RECOMMENDED_PLUGINS.map(plugin => plugin.packageName)).toEqual([
      'dsh-web-mobile',
    ])
  })

  it('exposes the optional Company Pack on Internal Market without silent install', () => {
    expect(COMPANY_PACK_RECOMMENDED_ENTRY.packageName).toBe(COMPANY_PACK_PACKAGE_NAME)
    expect(COMPANY_PACK_RECOMMENDED_ENTRY.role).toBe('company-pack')
    const plan = buildCompanyPackInstallPlan()
    expect(plan.entries[0]?.kind).toBe('pack')
    expect(plan.companyChildren.length).toBeGreaterThan(0)
    expect(plan.communityRecommendations.length).toBeGreaterThan(0)
    expect(recommendedPluginsFor('company-pack').map(plugin => plugin.packageName)).toEqual([
      'dsh-better-sidebar',
      'dsh-context',
    ])
  })

  it('starts office IM from official DingTalk Stream and WeCom without gating community installs', () => {
    expect(OFFICE_IM_RECOMMENDED_PLUGINS.map(plugin => plugin.packageName)).toEqual([
      'dsh-dingtalk-channel',
      'dsh-wecom',
    ])
    expect(OFFICE_IM_RECOMMENDED_PLUGINS.map(plugin => plugin.role)).toEqual([
      'office-dingtalk',
      'office-wecom',
    ])
    for (const packageName of [
      'dsh-im',
      'dsh-message',
      'dsh-messge-channels',
      'dsh-collaboration-channels',
      'dsh-lark',
      'dsh-better-sidebar',
    ]) {
      expect(workerPackBlocksCommunityPackage(packageName)).toBe(false)
    }
  })

  it('keeps worker-pack locale keys aligned', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    expect(zh.builtinTab).toBe('内置')
    expect(zh.workerBody).toContain('Example Company')
    expect(zh.companyPackBody).toContain('确认')
    expect(zh.companyPackBody).toContain('不会开机自动装')
    expect(zh.officeImBody).toContain('不是白名单')
    expect(en.builtinTab).toBe('Built-in')
    expect(en.workerBody).toContain('Example Company')
    expect(en.companyPackBody).toContain('Confirming')
    expect(en.companyPackBody).toContain('never silent-preinstalls')
    expect(en.officeImBody).toContain('not an allowlist')
  })

  it('keeps desktop workbench pages under the Built-in Plugins tab', () => {
    expect(DESKTOP_BUILTIN_PLUGINS_TAB_ID).toBe('desktop-builtin')
    expect(DESKTOP_ENTERPRISE_PLUGINS_TAB_ID).toBe('desktop-enterprise')
    expect(DESKTOP_CURATED_PLUGINS_TAB_ID).toBe('desktop-curated')
    expect(DESKTOP_INTERNAL_MARKET_TAB_ID).toBe(DESKTOP_CURATED_PLUGINS_TAB_ID)
    expect(DESKTOP_PLUGIN_SETTINGS_TAB_IDS).toEqual([
      'desktop-builtin',
    ])
    expect(COMPANY_EXAMPLE_SETTINGS_SECTION_ID).toBe('company-example')
    expect(DESKTOP_WORKBENCH_PAGE_IDS).toEqual(['models', 'home', 'remote', 'mcp'])
  })

  it('defers Example Company Settings hub to dsh-plugin-company-example', () => {
    const companyPkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      dependencies?: Record<string, string>
    }
    const hub = readFileSync(new URL('../src/client/DesktopWorkbenchHub.tsx', import.meta.url), 'utf8')
    const client = readFileSync(new URL('../src/client/index.ts', import.meta.url), 'utf8')
    const patch = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
    expect(String(companyPkg.dependencies?.['dsh-plugin-company-example'] ?? '')).toContain('dsh-plugin-company-example')
    expect(hub).toContain('McpSettingsTab')
    expect(hub).not.toContain('installRecommendedPlugins')
    expect(client).toContain('DESKTOP_BUILTIN_PLUGINS_TAB_ID')
    expect(client).not.toContain('CompanyExampleSection')
    expect(client).not.toContain('DESKTOP_ENTERPRISE_PLUGINS_TAB_ID')
    expect(patch).toContain('dsh-plugin-desktop/company-pack-install')
    expect(patch).toContain('dsh-plugin-company-example')
    expect(patch).not.toMatch(/name:\s*dsh-plugin-company-pack\b/u)
  })

  it('groups one-click packs without making them a silent boot list', () => {
    expect(recommendedPluginsFor('workspace').map(plugin => plugin.packageName)).toEqual([
      'dsh-better-sidebar',
      'dsh-context',
    ])
    expect(recommendedPluginsFor('office-im').map(plugin => plugin.packageName)).toEqual([
      'dsh-dingtalk-channel',
      'dsh-wecom',
    ])
    expect(recommendedPluginsFor('later').map(plugin => plugin.packageName)).toEqual([
      'dsh-web-mobile',
    ])
    expect(isWorkerPackRecommendedPackage('dsh-better-sidebar')).toBe(true)
    expect(isWorkerPackRecommendedPackage('dsh-plugin-company-pack')).toBe(true)
    expect(isWorkerPackRecommendedPackage('dsh-im')).toBe(false)
  })

  it('matches installed recommendations and exact catalog package names', () => {
    expect(recommendedPackageInstalled('dsh-context', [
      { receipt: { packageName: 'dsh-context' } },
    ])).toBe(true)
    expect(recommendedPackageInstalled('dsh-context', [
      { packageName: 'dsh-better-sidebar' },
    ])).toBe(false)
    expect(findCatalogItemForPackage([
      { id: 'other', package: { name: 'dsh-im' } },
      { id: 'sidebar', package: { name: 'dsh-better-sidebar' } },
    ], 'dsh-better-sidebar')?.id).toBe('sidebar')
    expect(findCatalogItemForPackage([
      { id: 'fuzzy', package: { name: 'dsh-better-sidebar-extra' } },
    ], 'dsh-better-sidebar')).toBeUndefined()
  })

  it('summarizes user-initiated install results', () => {
    expect(summarizeWorkerPackInstallResults([
      { packageName: 'dsh-context', status: 'installed' },
      { packageName: 'dsh-better-sidebar', status: 'already' },
    ])).toBe('installRestart')
    expect(summarizeWorkerPackInstallResults([
      { packageName: 'dsh-context', status: 'installed' },
      { packageName: 'dsh-better-sidebar', status: 'missing' },
    ])).toBe('installPartial')
    expect(summarizeWorkerPackInstallResults([
      { packageName: 'dsh-context', status: 'missing' },
    ])).toBe('installMissing')
    expect(summarizeWorkerPackInstallResults([
      { packageName: 'dsh-context', status: 'failed', error: 'network' },
    ])).toBe('installError')
    expect(summarizeWorkerPackInstallResults([])).toBe('installError')
  })

  it('treats the catalog as selected only after an explicit enabled source', () => {
    expect(workerPackCatalogSelected([])).toBe(false)
    expect(workerPackCatalogSelected([
      { enabled: false, builtInProviderKey: WORKER_PACK_CATALOG_SOURCE_KEY },
    ])).toBe(false)
    expect(workerPackCatalogSelected([
      { enabled: true, builtInProviderKey: WORKER_PACK_CATALOG_SOURCE_KEY },
    ])).toBe(true)
  })
})
