import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  typescript: {
    overrides: {
      'ts/ban-ts-comment': 'off',
      'ts/prefer-ts-expect-error': 'off',
    },
  },
  stylistic: {
    overrides: {
      // 允许单行 if 语句不换行
      'antfu/if-newline': 'off',
      // 禁用花括号换行规则
      'style/brace-style': 'off',
    },
  },
  rules: {
    // 禁用 prefer-node-protocol 规则
    'unicorn/prefer-node-protocol': 'off',
    // require('process'); // 不再报错
    'node/prefer-global/process': 'off',
    // 不再必须使用 export function foo() {}
    // 可以使用 export const foo = () => {}
    'antfu/top-level-function': 'off',
    'no-console': 'off', // 关闭 console 规则
  },
})
