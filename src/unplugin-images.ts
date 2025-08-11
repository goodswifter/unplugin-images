import type { Plugin } from 'vite'
import { execSync } from 'node:child_process'
import gradient from 'gradient-string'

type GenImages = {
  /** 图片目录 */
  dir?: string
  /** 输出文件 */
  dts?: string
}

// 创建自定义插件来执行 gen:images:once 命令
const UnpluginImages = (options: GenImages = {}): Plugin => {
  const { dir = 'src/assets/images', dts = 'src/assets/r.ts' } = options

  return {
    name: 'unplugin-images',
    // 在构建开始时执行
    buildStart() {
      console.log(gradient(['cyan', 'magenta']).multiline('正在执行 gen:images 命令...'))
      try {
        // { stdio: 'inherit' }: stdio 标准输入输出, 子进程的输出会实时显示在控制台上
        execSync(`node ./generate-images.ts --dir ${dir} --dts ${dts}`, { stdio: 'inherit' })
        console.log('gen:images 命令执行完成')
      } catch (error) {
        console.error('执行 gen:images 命令失败:', error)
      }
    },
  }
}

export default UnpluginImages
