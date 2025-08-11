import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createUnplugin } from 'unplugin'
import { runGenerator, resolveOptions } from './generator'

export const unpluginFactory: UnpluginFactory<Options | undefined> = rawOptions => {
  const resolved = resolveOptions(rawOptions || {})
  let disposer: { close?: () => Promise<void> | void } | undefined

  return {
    name: 'unplugin-images',
    buildStart() {
      disposer = runGenerator(resolved)
    },
    async buildEnd() {
      await disposer?.close?.()
    },
    closeBundle() {
      // for some bundlers that may not call buildEnd
      return disposer?.close?.()
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
