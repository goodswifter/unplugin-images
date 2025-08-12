import fs from 'node:fs'
import path from 'node:path'

/**
 * 可识别的图片后缀列表
 */
export const IMAGE_EXTENSIONS: string[] = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']

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
export const writeConstants = (constants: Record<string, string>, dtsFile: string): void => {
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
