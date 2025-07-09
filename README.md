# AI图片生成MCP服务器

## 📦 MCP服务器信息

**服务器名称**: ai-image-generation-mcp-server  
**版本**: 1.0.0  
**描述**: AI图片生成MCP服务器 - 智能内容分析与批量图片生成  
**类型**: MCP Server  
**运行时**: Node.js 18+  
**API依赖**: ModelScope FLUX.1-dev  

### 🛠️ 支持的MCP工具

| 工具名称 | 功能描述 |
|---------|----------|
| `analyze-webpage-images` | 分析网页HTML内容，自动识别图片需求 |
| `analyze-article-images` | 分析文章内容，生成智能配图建议 |
| `generate-single-image` | 使用ModelScope FLUX模型生成单张图片 |
| `generate-webpage-images` | 批量生成网页所需的所有图片 |
| `generate-article-images` | 批量生成文章配图 |
| `validate-api-key` | 验证ModelScope API密钥有效性 |

### 📚 MCP资源

| 资源URI | 描述 |
|---------|------|
| `templates://image-types` | 提供各种图片类型的模板和尺寸建议 |
| `guide://usage` | 详细的使用指南和最佳实践 |

一个功能强大的Model Context Protocol (MCP) 服务器，集成ModelScope FLUX.1-dev模型，为网页开发和文章配图提供智能AI图片生成功能。

## 🌟 项目特色

- **智能内容分析**：自动识别HTML和文章中的图片需求
- **上下文感知**：根据内容主题生成相关图片
- **批量处理**：支持多张图片并行生成
- **专业图片质量**：使用ModelScope FLUX.1-dev模型生成高质量图片
- **MCP标准兼容**：完全遵循MCP协议规范

## 🎯 实际应用演示

### SneakerZone球鞋电商网站
本项目包含一个完整的球鞋电商网站演示，展示了AI图片生成的实际应用：

- 🏪 **完整电商网站**：现代化的响应式设计
- 🎨 **12张AI生成图片**：包括品牌Logo、产品图片、Hero横幅
- 🔗 **自动化集成**：AI图片自动填充到网页对应位置
- 🌐 **即开即用**：双击`preview.bat`即可在浏览器预览

#### 生成的图片类型
1. SneakerZone品牌Logo
2. Hero区域球鞋合集展示
3. Nike Air Jordan 1产品图
4. Adidas Yeezy Boost产品图
5. New Balance 990v5产品图
6. Vans Old Skool产品图
7. Nike品牌标识
8. Adidas品牌标识
9. New Balance品牌标识
10. Vans品牌标识
11. Converse品牌标识
12. Puma品牌标识

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- ModelScope API密钥

### 安装依赖
```bash
npm install
```

### 编译TypeScript
```bash
npm run build
```

### 运行测试
```bash
npm test
```

### 启动MCP服务器
```bash
npm start
```

## 🛠️ MCP工具

### 核心工具
1. **analyze-webpage-images** - 分析网页HTML中的图片需求
2. **analyze-article-images** - 分析文章内容并生成配图建议
3. **generate-single-image** - 生成单张图片
4. **generate-webpage-images** - 批量生成网页所需图片
5. **generate-article-images** - 批量生成文章配图
6. **validate-api-key** - 验证ModelScope API密钥

### MCP资源
1. **image-type-templates** - 不同图片类型的模板
2. **usage-guide** - 详细使用指南

## 📊 API配置

### ModelScope配置
- **端点**: `https://api-inference.modelscope.cn/v1/images/generations`
- **模型**: `MusePublic/489_ckpt_FLUX_1`
- **认证**: Bearer Token

### 使用方式
```typescript
const modelScopeService = new ModelScopeService({
  apiKey: 'your-api-key-here',
  endpoint: 'https://api-inference.modelscope.cn/v1/images/generations',
  modelId: 'MusePublic/489_ckpt_FLUX_1'
});
```

## 🏗️ 项目结构

```
src/
├── types.ts              # TypeScript类型定义
├── index.ts              # MCP服务器主入口
├── services/
│   ├── modelscope.ts     # ModelScope API集成
│   └── analyzer.ts       # 内容分析服务
└── tests/
    ├── analyzer.test.ts  # 分析器单元测试
    └── modelscope.test.ts # API服务单元测试
```

## 🎨 球鞋电商网站演示

### 文件说明
- `shoe-store.html` - 原始HTML模板
- `shoe-store-final.html` - **包含AI生成图片的完整版本**
- `preview.bat` - Windows下的快速预览脚本

### 查看演示
1. 确保已安装依赖并编译项目
2. 双击 `preview.bat` 或直接打开 `shoe-store-final.html`
3. 在浏览器中查看完整的球鞋电商网站效果

## 🧪 测试覆盖

- ✅ API连接测试
- ✅ 内容分析准确性测试
- ✅ 图片生成功能测试
- ✅ 端到端集成测试
- ✅ 错误处理机制测试

## 📈 技术栈

- **Runtime**: Node.js + TypeScript
- **MCP Framework**: @modelcontextprotocol/sdk
- **AI API**: ModelScope FLUX.1-dev
- **测试**: Jest + ts-jest
- **代码规范**: ESLint + Prettier

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🔗 相关链接

- [ModelScope 平台](https://modelscope.cn/)
- [MCP 协议文档](https://modelcontextprotocol.io/)
- [FLUX.1-dev 模型](https://modelscope.cn/models/MusePublic/489_ckpt_FLUX_1)

## 📧 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

---

*本项目完整展示了AI图片生成在实际网页开发中的应用，为开发者提供了从内容分析到图片生成的完整解决方案。* 