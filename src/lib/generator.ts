import type { FSWatcher } from 'chokidar'
import type { Options } from './types'
import path from 'node:path'
import chokidar from 'chokidar'

import gradient, { cristal, instagram, passion } from 'gradient-string'
import { collectImageFiles, IMAGE_EXTENSIONS, writeConstants } from './io'
import { toConstantName } from './naming'

/**
 * 解析用户配置为内部统一结构
 */
export const resolveOptions = (userOptions: Options = {}): Options => {
  const root = userOptions.root || process.cwd()
  const dir = path.isAbsolute(userOptions.dir || '')
    ? (userOptions.dir as string)
    : path.join(root, userOptions.dir || 'src/assets/images')
  const dts = path.isAbsolute(userOptions.dts || '')
    ? (userOptions.dts as string)
    : path.join(root, userOptions.dts || 'src/assets/r.ts')
  const isProd = process.env.NODE_ENV === 'production'
  const watch = userOptions.watch ?? !isProd
  return { root, dir, dts, watch }
}

/**
 * 生成 图片常量名 → 绝对路径 的映射表
 */
export const generateConstantsMap = (assetDir: string): Record<string, string> => {
  const files = collectImageFiles(assetDir)
  const constants: Record<string, string> = {}
  for (const file of files) {
    const name = toConstantName(file, assetDir)
    constants[name] = file
  }
  return constants
}

/**
 * 仅生成一次资源常量文件（不进入监听）
 */
export const generateOnce = (options: Options = {}): void => {
  const resolved = resolveOptions(options)
  const constants = generateConstantsMap(resolved.dir!)
  writeConstants(constants, resolved.dts!)
}

/**
 * 监听图片目录的变化并在变更时重新生成常量文件
 */
export const watchImages = (options: Options = {}, onChange?: () => void): FSWatcher => {
  const resolved = resolveOptions(options)
  console.log(gradient(['cyan', 'cyan']).multiline(`Watching for changes in ${resolved.dir}`))
  const watcher = chokidar.watch(resolved.dir!, {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: true,
  })

  // 重新生成常量文件
  const regenerate = (): void => {
    const constants = generateConstantsMap(resolved.dir!)
    writeConstants(constants, resolved.dts!)
    onChange?.()
  }

  let timer: NodeJS.Timeout | undefined
  const debounced = (): void => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(regenerate, 200)
  }

  watcher
    .on('add', (filePath: string) => {
      const ext = path.extname(filePath).toLowerCase()
      if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
        console.log(cristal(`File ${filePath} has been added`))
        debounced()
      }
    })
    .on('change', (filePath: string) => {
      const ext = path.extname(filePath).toLowerCase()
      if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
        console.log(`File ${filePath} has been changed`)
        debounced()
      }
    })
    .on('unlink', (filePath: string) => {
      const ext = path.extname(filePath).toLowerCase()
      if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
        console.log(passion(`File ${filePath} has been removed`))
        debounced()
      }
    })
    .on('addDir', (dirPath: string) => {
      console.log(cristal(`Directory ${dirPath} has been added`))
      debounced()
    })
    .on('unlinkDir', (dirPath: string) => {
      console.log(instagram(`Directory ${dirPath} has been removed`))
      debounced()
    })
    .on('ready', () => {
      console.log(gradient(['cyan', 'cyan']).multiline('Initial scan complete, ready for changes'))
    })
    .on('error', (error: unknown) => {
      console.error(passion(`Error: ${error}`))
    })

  return watcher
}

/**
 * 运行生成流程：生成一次；若开启监听则启动 watcher 并返回关闭方法
 */
export const runGenerator = (options: Options = {}): { close?: () => Promise<void> | void } => {
  const resolved = resolveOptions(options)
  console.log(gradient(['cyan', 'magenta']).multiline('Generating image constants...'))
  generateOnce(resolved)
  if (!resolved.watch) return {}
  const watcher = watchImages(resolved)
  return { close: async () => await watcher.close() }
}
