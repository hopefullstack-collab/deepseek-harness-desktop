/**
 * Desktop-owned Company Pack install bridge.
 * Always available so confirm-to-install works before the pack is enabled.
 * Does not default-insert the Pack into cordis.patch.yml.
 */

import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import {
  buildCompanyPackInstallPlan,
  cascadeCompanyPackInstall,
  type CompanyPackCommunityInstallTarget,
} from 'dsh-plugin-company-pack/install'
import {
  COMPANY_PACK_COMMUNITY_RECOMMENDATIONS,
  COMPANY_PACK_DISPLAY_NAME,
  COMPANY_PACK_PACKAGE_NAME,
} from 'dsh-plugin-company-pack/manifest'
import * as companyPack from 'dsh-plugin-company-pack'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from './pnpm.ts'
import type {} from './profile-service.ts'
import { readCompanyPackOptIn, writeCompanyPackOptIn } from './company-pack-opt-in.ts'

/** Stable Cordis plugin name for the install bridge (not the Pack itself). */
export const name = 'desktop-company-pack-install'

/** Web server required for confirm-to-install routes. */
export const inject = ['webServer']

export const COMPANY_PACK_API_PREFIX = '/api/desktop/company-pack'

const MAX_BODY_BYTES = 32 * 1024

function finishJson(res: ServerResponse, statusCode: number, value: object): void {
  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(value))
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > MAX_BODY_BYTES) throw new Error('request body is too large')
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}

function requestUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? '/', 'http://127.0.0.1')
}

function parseCommunityTargets(value: unknown): CompanyPackCommunityInstallTarget[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set(
    COMPANY_PACK_COMMUNITY_RECOMMENDATIONS.map(plugin => plugin.packageName),
  )
  const targets: CompanyPackCommunityInstallTarget[] = []
  for (const entry of value) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('invalid community target')
    }
    const row = entry as Record<string, unknown>
    const packageName = row.packageName
    const packageVersion = row.packageVersion
    if (typeof packageName !== 'string' || !allowed.has(packageName)) {
      throw new Error('community target is not a Company Pack recommendation')
    }
    if (typeof packageVersion !== 'string') {
      throw new Error('community target requires an exact packageVersion')
    }
    targets.push({
      packageName,
      packageVersion,
      receiptId: typeof row.receiptId === 'string' && row.receiptId.length > 0
        ? row.receiptId
        : randomUUID(),
    })
  }
  return targets
}

/**
 * Register confirm-to-install routes and load the pack only after opt-in.
 */
export function apply(ctx: Context): void {
  if (ctx.webServer.host !== '127.0.0.1') {
    throw new Error('dsh-plugin-desktop/company-pack-install: routes require a loopback Web server')
  }
  const home = resolveDshHome()
  let packLoaded = false
  const loadPackIfEnabled = (): void => {
    if (packLoaded || !readCompanyPackOptIn(home)) return
    // Company Pack shares the Desktop Cordis release; boundary cast for ctx.plugin.
    const plugin = companyPack as unknown as Parameters<Context['plugin']>[0]
    ctx.plugin(plugin, undefined as never)
    packLoaded = true
  }
  loadPackIfEnabled()

  ctx.effect(
    () => ctx.webServer.register({
      kind: 'prefix',
      path: COMPANY_PACK_API_PREFIX,
      handler: async (req, res) => {
        const url = requestUrl(req)
        const path = url.pathname
        try {
          if (path === COMPANY_PACK_API_PREFIX && req.method === 'GET') {
            return finishJson(res, 200, {
              enabled: readCompanyPackOptIn(home),
              plan: buildCompanyPackInstallPlan(),
              displayName: COMPANY_PACK_DISPLAY_NAME,
              packageName: COMPANY_PACK_PACKAGE_NAME,
            })
          }
          if (path === `${COMPANY_PACK_API_PREFIX}/confirm` && req.method === 'POST') {
            const body = await readJson(req) as { confirmed?: unknown; communityTargets?: unknown }
            if (body.confirmed !== true) {
              return finishJson(res, 400, { error: 'explicit confirmation required' })
            }
            const communityTargets = parseCommunityTargets(body.communityTargets)
            const profiles = ctx.get('desktopProfiles') as { current: { dir: string } } | undefined
            const pnpm = ctx.get('desktopPnpm') as {
              installPlugin: (request: {
                invokingDir: string
                recovery: { packageName: string; packageVersion: string; receiptId: string }
              }) => Promise<{ done: Promise<unknown> }>
            } | undefined

            const result = await cascadeCompanyPackInstall(
              {
                enableBundledPack: async () => {
                  writeCompanyPackOptIn(home, true)
                  loadPackIfEnabled()
                },
                installCommunityPlugin: async (target) => {
                  if (profiles === undefined || pnpm === undefined) {
                    throw new Error('desktop package operations unavailable')
                  }
                  const handle = await pnpm.installPlugin({
                    invokingDir: profiles.current.dir,
                    recovery: {
                      packageName: target.packageName,
                      packageVersion: target.packageVersion,
                      receiptId: target.receiptId,
                    },
                  })
                  await handle.done
                },
              },
              { confirmed: true, communityTargets },
            )
            return finishJson(res, 200, {
              ok: true,
              packEnabled: result.packEnabled,
              communityInstalled: result.communityInstalled,
              plan: result.plan,
            })
          }
          return finishJson(res, 404, { error: 'not found' })
        } catch (cause) {
          return finishJson(res, 400, {
            error: cause instanceof Error ? cause.message : 'company pack request failed',
          })
        }
      },
    }),
    'dsh-plugin-desktop: company pack install routes',
  )
}
