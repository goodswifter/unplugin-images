## unplugin-images

自动扫描你的图片目录，生成可直接导入使用的常量映射文件（默认 `src/assets/r.ts`）。基于 [unplugin](https://github.com/unjs/unplugin)，兼容 Vite、Rollup、Webpack、Rspack、esbuild、Farm、Nuxt、Astro 等生态。

### 特性

- 自动递归扫描图片目录（默认 `src/assets/images`）
- 按规则生成常量名，避免手写路径与拼写错误
- 构建开始自动生成；开发环境可监听变更并自动再生成
- 生成文件内容不变则跳过写入，避免不必要的重建
- 在构建开始时生成图片常量文件，开发模式自动监听与增量生成；在构建结束时释放 watcher。

### 安装

```bash
# 推荐 pnpm
pnpm add -D unplugin-images
# 或
npm i -D unplugin-images
# 或
yarn add -D unplugin-images
```

### 快速开始（Vite）

```ts
// vite.config.ts
import Images from 'unplugin-images/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    Images({
      // 可选：图片目录与输出文件（默认见下方“配置项”）
      // dir: 'src/assets/images',
      // dts: 'src/assets/r.ts',
    }),
  ],
})
```

在代码中使用（假设使用默认输出路径）：

```ts
// 示例：在任意组件/模块中
import R from '@/assets/r' // 或根据你的路径别名/相对路径导入

// R.ICON_LOGO_PNG、R.BANNER_AT_2X_WEBP 等即为具体图片资源
```

生成文件（默认 `src/assets/r.ts`）的典型结构：

```ts
import ICON_LOGO_PNG from './images/icons/logo.png'
// ...

const R = {
  ICON_LOGO_PNG,
  // ...
}

export default R
```

### 常量命名规则

- 使用「目录名*文件名*后缀」的全大写下划线风格，例如：
  - `icons/logo.png` → `ICONS_LOGO_PNG`
  - 根目录文件 `banner@2x.webp` → `BANNER_AT_2X_WEBP`
- 目录分隔符转换为下划线；`-` 转为 `_`；`@` 转为 `_AT_`
- 后缀会追加为大写（如 `_PNG`、`_SVG`）

### 配置项 Options

```ts
interface Options {
  /** 图片目录（相对项目根目录或绝对路径） */
  dir?: string // 默认：'src/assets/images'
  /** 生成的常量文件路径（相对项目根目录或绝对路径） */
  dts?: string // 默认：'src/assets/r.ts'
  /** 是否在开发时监听变更自动再生成（默认：开发 true，生产 false） */
  watch?: boolean
  /** 项目根目录，用于解析相对路径（默认：process.cwd()） */
  root?: string
}
```

### 不同构建器的用法

<details>
<summary>Rollup</summary>

```ts
// rollup.config.ts
import Images from 'unplugin-images/rollup'

export default {
  plugins: [
    Images({
      /* options */
    }),
  ],
}
```

</details>

<details>
<summary>Webpack</summary>

```ts
// webpack.config.js
module.exports = {
  // ...
  plugins: [
    require('unplugin-images/webpack')({
      /* options */
    }),
  ],
}
```

</details>

<details>
<summary>Rspack</summary>

```ts
// rspack.config.ts
import Images from 'unplugin-images/rspack'

export default {
  plugins: [
    Images({
      /* options */
    }),
  ],
}
```

</details>

<details>
<summary>esbuild</summary>

```ts
// esbuild.config.ts
import { build } from 'esbuild'
import Images from 'unplugin-images/esbuild'

build({
  plugins: [Images()],
})
```

</details>

<details>
<summary>Farm</summary>

```ts
// farm.config.ts
import Images from 'unplugin-images/farm'

export default {
  plugins: [
    Images({
      /* options */
    }),
  ],
}
```

</details>

<details>
<summary>Nuxt</summary>

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    [
      'unplugin-images/nuxt',
      {
        /* options */
      },
    ],
  ],
})
```

</details>

<details>
<summary>Astro</summary>

```ts
// astro.config.mjs
import images from 'unplugin-images/astro'

export default {
  integrations: [
    images({
      /* options */
    }),
  ],
}
```

</details>

### 工作机制

- 构建开始时会生成一次常量文件
- 当 `watch: true`（默认开发环境）时，监听图片文件与目录的新增/修改/删除并自动再生成
- 若输出内容与上次完全一致，将跳过写入

### 许可协议

MIT
