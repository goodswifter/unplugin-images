import type { UnpluginFactory } from 'unplugin'
import type { Options } from './lib'
import { createUnplugin } from 'unplugin'
import { resolveOptions, runGenerator } from './lib'

/**
 * 创建 unplugin 工厂函数
 *
 * @param rawOptions 原始选项
 * @returns unplugin 工厂函数
 */
export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  rawOptions: Options | undefined,
) => {
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
