import type { ImportStyle } from './types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 可识别的图片后缀列表
 */
export const IMAGE_EXTENSIONS: string[] = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']

/**
 * 将路径转换为跨平台兼容的格式（统一使用正斜杠）
 */
const normalizePath = (pathStr: string): string => {
  return pathStr.replace(/\\/g, '/')
}

/**
 * 生成相对导入路径
 */
const generateImportPath = (
  fromDir: string,
  absolutePath: string,
  importStyle: ImportStyle,
): string => {
  const normalizedFromDir = normalizePath(fromDir)
  const prefix = importStyle === 'uniapp' ? '' : '@'
  const relDir = normalizedFromDir.includes('src/')
    ? `${prefix}/${normalizedFromDir.split('src/')[1]}`
    : normalizedFromDir

  let rel = path.relative(fromDir, absolutePath)
  rel = normalizePath(rel)

  return `${relDir}/${rel}`
}

/**
 * 递归收集指定目录下的所有图片文件（返回绝对路径）
 */
export const collectImageFiles = (assetDir: string): string[] => {
  const collected: string[] = []
  // 递归访问指定目录下的所有图片文件
  const visit = (dir: string): void => {
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

/**
 * 将常量映射写入目标文件（若内容未变化则跳过写入）
 */
export const writeConstants = (
  constants: Record<string, string>,
  dtsFile: string,
  importStyle: ImportStyle = 'import',
): void => {
  const entries = Object.entries(constants)

  let imports: string
  if (importStyle === 'import' || importStyle === 'uniapp') {
    // 使用 import 导入方式
    imports = entries
      .map(([key, absolutePath]) => {
        const fromDir = path.dirname(dtsFile)
        const importPath = generateImportPath(fromDir, absolutePath, importStyle)
        return `import ${key} from '${importPath}'`
      })
      .join('\n')
  } else {
    // 使用 URL 导入方式
    imports = entries
      .map(([key, absolutePath]) => {
        const fromDir = path.dirname(dtsFile)
        let rel = path.relative(fromDir, absolutePath)
        if (!rel.startsWith('.')) rel = `./${rel}`
        const importPath = normalizePath(rel)
        return `const ${key} = new URL('${importPath}', import.meta.url).href`
      })
      .join('\n')
  }

  const fileContent = `/**\n * 图片资源常量\n * 自动生成，请勿手动修改\n */\n${imports}\n\nconst R = {\n${entries
    .map(([key]) => {
      const needsQuotes = /\$/.test(key)
      const formattedKey = needsQuotes ? `'${key}'` : key
      return `  ${formattedKey},`
    })
    .join('\n')}\n}\n\nexport { R }\n`

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
