import fs from 'node:fs'
import path from 'node:path'
import chokidar, { FSWatcher } from 'chokidar'
import gradient from 'gradient-string'

import type { Options } from './types'

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']

export interface ResolvedOptions {
  root: string
  dir: string
  dts: string
  watch: boolean
}

export function resolveOptions(userOptions: Options = {}): ResolvedOptions {
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

function toConstantName(filePath: string, baseDir: string): string {
  const relativePath = path.relative(baseDir, filePath)
  const dirName = path.dirname(relativePath)
  const fileNameWithoutExt = path.basename(filePath, path.extname(filePath))
  const ext = path.extname(filePath).slice(1).toUpperCase()

  const processName = (name: string) =>
    name.toUpperCase().replaceAll('-', '_').replaceAll('@', '_AT_')

  if (dirName === '.' || dirName === '') return `${processName(fileNameWithoutExt)}_${ext}`

  const folderName = dirName.split(path.sep).join('_').toUpperCase().replaceAll('-', '_')
  const formattedFileName = processName(fileNameWithoutExt)
  return `${folderName}_${formattedFileName}_${ext}`
}

export function collectImageFiles(assetDir: string): string[] {
  const collected: string[] = []
  const visit = (dir: string) => {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.name === '.DS_Store') continue
      if (entry.isDirectory()) {
        visit(fullPath)
      } else if (IMAGE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        collected.push(fullPath)
      }
    }
  }
  visit(assetDir)
  return collected
}

export function generateConstantsMap(assetDir: string): Record<string, string> {
  const files = collectImageFiles(assetDir)
  const constants: Record<string, string> = {}
  for (const file of files) {
    const name = toConstantName(file, assetDir)
    constants[name] = file
  }
  return constants
}

export function writeConstants(constants: Record<string, string>, dtsFile: string): void {
  const entries = Object.entries(constants)

  const imports = entries
    .map(([key, absolutePath]) => {
      const fromDir = path.dirname(dtsFile)
      let rel = path.relative(fromDir, absolutePath)
      if (!rel.startsWith('.')) rel = `./${rel}`
      const importPath = rel.split(path.sep).join('/')
      return `import ${key} from '${importPath}'`
    })
    .join('\n')

  const fileContent = `/**\n * 图片资源常量\n * 自动生成，请勿手动修改\n */\n${imports}\n\nconst R = {\n${entries
    .map(([key]) => {
      const needsQuotes = /\$/.test(key)
      const formattedKey = needsQuotes ? `'${key}'` : key
      return `  ${formattedKey},`
    })
    .join('\n')}\n}\n\nexport default R\n`

  try {
    const exists = fs.existsSync(dtsFile)
    if (exists) {
      const prev = fs.readFileSync(dtsFile, 'utf8')
      if (prev === fileContent) {
        console.log('No changes in assets. Skip writing:', dtsFile)
        return
      }
    }
  } catch {}

  fs.mkdirSync(path.dirname(dtsFile), { recursive: true })
  fs.writeFileSync(dtsFile, fileContent, 'utf8')
  console.log('Assets constants generated at:', dtsFile)
}

export function generateOnce(options: Options = {}): void {
  const resolved = resolveOptions(options)
  const constants = generateConstantsMap(resolved.dir)
  writeConstants(constants, resolved.dts)
}

export function watchImages(options: Options = {}, onChange?: () => void): FSWatcher {
  const resolved = resolveOptions(options)
  console.log(gradient(['cyan', 'cyan']).multiline(`Watching for changes in ${resolved.dir}`))
  const watcher = chokidar.watch(resolved.dir, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: true,
  })

  const regenerate = () => {
    const constants = generateConstantsMap(resolved.dir)
    writeConstants(constants, resolved.dts)
    onChange?.()
  }

  const debounce = (fn: () => void, wait: number) => {
    let t: NodeJS.Timeout | undefined
    return () => {
      if (t) clearTimeout(t)
      t = setTimeout(fn, wait)
    }
  }

  const debounced = debounce(regenerate, 200)

  watcher
    .on('add', debounced)
    .on('change', debounced)
    .on('unlink', debounced)
    .on('addDir', debounced)
    .on('unlinkDir', debounced)

  return watcher
}

export function runGenerator(options: Options = {}): { close?: () => Promise<void> | void } {
  const resolved = resolveOptions(options)
  console.log(gradient(['cyan', 'magenta']).multiline('Generating image constants...'))
  generateOnce(resolved)
  if (!resolved.watch) return {}
  const watcher = watchImages(resolved)
  return {
    close: async () => {
      await watcher.close()
    },
  }
}
