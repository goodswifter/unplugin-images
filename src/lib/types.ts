export interface Options {
  /**
   * 图片目录(相对项目根目录或绝对路径)
   *
   * 默认: src/assets/images, 必须包含 `src/`
   */
  dir?: string
  /**
   * 生成的常量文件路径(相对项目根目录或绝对路径)
   *
   * 默认: dir - 去掉images + `r.ts`
   */
  dts?: string
  /**
   * 是否在开发时监听变更自动再生成
   *
   * 默认: 开发环境 `true`, 生产环境 `false`
   */
  watch?: boolean
  /**
   * 项目根目录，用于解析相对路径
   *
   * 默认: 当前工作目录
   */
  root?: string
  /**
   * 导入方式
   *
   * 默认: `import` import xxx from 'xxx'
   * 可选: `url` const xxx = new URL('xxx', import.meta.url).href
   */
  importStyle?: 'import' | 'url'
}
