import path from 'node:path'

/**
 * 将文件路径转换为常量名：目录_文件名_后缀（大写），`-`→`_`，`@`→`_AT_`
 */
export function toConstantName(filePath: string, baseDir: string): string {
  const relativePath = path.relative(baseDir, filePath)
  const dirName = path.dirname(relativePath)
  const fileNameWithoutExt = path.basename(filePath, path.extname(filePath))
  const ext = path.extname(filePath).slice(1).toUpperCase()

  const processName = (name: string): string =>
    name.toUpperCase().replaceAll('-', '_').replaceAll('@', '_AT_')

  if (dirName === '.' || dirName === '') return `${processName(fileNameWithoutExt)}_${ext}`

  const folderName = dirName.split(path.sep).join('_').toUpperCase().replaceAll('-', '_')
  const formattedFileName = processName(fileNameWithoutExt)
  return `${folderName}_${formattedFileName}_${ext}`
}
