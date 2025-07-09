/**
 * Jest测试配置
 * 支持TypeScript
 */

export default {
  // 使用ts-jest预设处理TypeScript文件
  preset: 'ts-jest',
  
  // 测试环境设置为Node.js
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/src/tests/**/*.test.ts',
    '**/src/**/*.test.ts'
  ],
  
  // Transform配置
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // 需要忽略的文件和目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // 覆盖率收集配置
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/types.ts'
  ],
  
  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'text-summary',
    'html'
  ],
  
  // 设置超时时间（毫秒）
  testTimeout: 10000,
  
  // 清理mock在每个测试之间
  clearMocks: true,
  
  // 恢复mock在每个测试之间
  restoreMocks: true,
  
  // 详细输出
  verbose: true
}; 