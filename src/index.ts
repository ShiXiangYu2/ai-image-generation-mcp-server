/**
 * AI图片生成MCP Server主入口文件
 * 提供网页和文章的图片生成能力
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { ModelScopeService } from './services/modelscope.js';
import { ContentAnalyzer } from './services/analyzer.js';
import type {
  ModelScopeConfig,
  ImageGenerationResult,
  WebPageAnalysis,
  ArticleAnalysis
} from './types.js';

/**
 * AI图片生成MCP Server类
 */
class AIImageGenerationServer {
  private server: McpServer;
  private modelScopeService: ModelScopeService | null = null;
  private contentAnalyzer: ContentAnalyzer;

  constructor() {
    // 初始化MCP服务器
    this.server = new McpServer({
      name: 'ai-image-generation-server',
      version: '1.0.0'
    });

    // 初始化内容分析器
    this.contentAnalyzer = new ContentAnalyzer();

    // 注册所有工具和资源
    this.registerTools();
    this.registerResources();
  }

  /**
   * 注册MCP工具
   */
  private registerTools(): void {
    // 1. 网页图片需求分析工具
    this.server.registerTool(
      'analyze-webpage-images',
      {
        title: '网页图片需求分析',
        description: '分析网页HTML内容，识别所需的图片类型和位置，生成相应的图片需求列表',
        inputSchema: {
          htmlContent: z.string().describe('网页HTML内容'),
          pageUrl: z.string().optional().describe('页面URL（可选）')
        }
      },
      async ({ htmlContent, pageUrl }) => {
        try {
          const analysis = this.contentAnalyzer.analyzeWebPage(htmlContent, pageUrl);

          return {
            content: [
              {
                type: 'text',
                text: `网页分析完成：\n\n页面标题：${analysis.title}\n\n检测到 ${analysis.imageRequirements.length} 个图片需求：\n\n${analysis.imageRequirements
                  .map(
                    (req, index) =>
                      `${index + 1}. ${req.type} - ${req.description}\n   位置：${req.context}\n   尺寸：${req.suggestedSize}\n   提示词：${req.prompt}`
                  )
                  .join('\n\n')}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `分析网页时发生错误：${error instanceof Error ? error.message : '未知错误'}`
              }
            ]
          };
        }
      }
    );

    // 2. 文章图片需求分析工具
    this.server.registerTool(
      'analyze-article-images',
      {
        title: '文章图片需求分析',
        description: '分析文章内容，自动生成合适的配图需求和数量建议',
        inputSchema: {
          articleText: z.string().describe('文章文本内容'),
          title: z.string().optional().describe('文章标题（可选）')
        }
      },
      async ({ articleText, title }) => {
        try {
          const analysis = this.contentAnalyzer.analyzeArticle(articleText, title);

          return {
            content: [
              {
                type: 'text',
                text: `文章分析完成：\n\n标题：${analysis.title}\n主题：${analysis.topic}\n建议配图数量：${analysis.suggestedImageCount}\n\n图片需求：\n\n${analysis.imageRequirements
                  .map(
                    (req, index) =>
                      `${index + 1}. ${req.description}\n   类型：${req.type}\n   尺寸：${req.suggestedSize}\n   提示词：${req.prompt}`
                  )
                  .join('\n\n')}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `分析文章时发生错误：${error instanceof Error ? error.message : '未知错误'}`
              }
            ]
          };
        }
      }
    );

    // 3. 生成单张图片工具
    this.server.registerTool(
      'generate-single-image',
      {
        title: '生成单张图片',
        description: '使用提供的提示词生成一张图片',
        inputSchema: {
          prompt: z.string().describe('英文图片生成提示词'),
          apiKey: z.string().describe('ModelScope API密钥')
        }
      },
      async ({ prompt, apiKey }) => {
        try {
          // 初始化ModelScope服务
          this.initializeModelScopeService(apiKey);

          if (!this.modelScopeService) {
            throw new Error('ModelScope服务初始化失败');
          }

          // 生成图片
          const imageUrl = await this.modelScopeService.generateImage({ prompt });

          return {
            content: [
              {
                type: 'text',
                text: `图片生成成功！\n\n提示词：${prompt}\n图片URL：${imageUrl}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `图片生成失败：${error instanceof Error ? error.message : '未知错误'}`
              }
            ]
          };
        }
      }
    );

    // 4. 批量生成网页图片工具
    this.server.registerTool(
      'generate-webpage-images',
      {
        title: '批量生成网页图片',
        description: '分析网页内容并批量生成所需的所有图片',
        inputSchema: {
          htmlContent: z.string().describe('网页HTML内容'),
          apiKey: z.string().describe('ModelScope API密钥'),
          pageUrl: z.string().optional().describe('页面URL（可选）')
        }
      },
      async ({ htmlContent, apiKey, pageUrl }) => {
        try {
          // 初始化ModelScope服务
          this.initializeModelScopeService(apiKey);

          if (!this.modelScopeService) {
            throw new Error('ModelScope服务初始化失败');
          }

          // 分析网页内容
          const analysis = this.contentAnalyzer.analyzeWebPage(htmlContent, pageUrl);

          // 批量生成图片
          const results: ImageGenerationResult[] = [];

          for (const requirement of analysis.imageRequirements) {
            try {
              const imageUrl = await this.modelScopeService.generateImage({
                prompt: requirement.prompt || requirement.description
              });

              results.push({
                requirement,
                imageUrl,
                generatedAt: new Date(),
                success: true
              });
            } catch (error) {
              results.push({
                requirement,
                imageUrl: '',
                generatedAt: new Date(),
                success: false,
                error: error instanceof Error ? error.message : '未知错误'
              });
            }
          }

          // 格式化结果
          const successCount = results.filter(r => r.success).length;
          const resultText = `网页图片生成完成！\n\n成功生成 ${successCount}/${results.length} 张图片：\n\n${results
            .map((result, index) => {
              if (result.success) {
                return `✅ ${index + 1}. ${result.requirement.description}\n   类型：${result.requirement.type}\n   URL：${result.imageUrl}`;
              } else {
                return `❌ ${index + 1}. ${result.requirement.description}\n   错误：${result.error}`;
              }
            })
            .join('\n\n')}`;

          return {
            content: [
              {
                type: 'text',
                text: resultText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `批量生成网页图片失败：${error instanceof Error ? error.message : '未知错误'}`
              }
            ]
          };
        }
      }
    );

    // 5. 批量生成文章图片工具
    this.server.registerTool(
      'generate-article-images',
      {
        title: '批量生成文章图片',
        description: '分析文章内容并批量生成合适的配图',
        inputSchema: {
          articleText: z.string().describe('文章文本内容'),
          apiKey: z.string().describe('ModelScope API密钥'),
          title: z.string().optional().describe('文章标题（可选）')
        }
      },
      async ({ articleText, apiKey, title }) => {
        try {
          // 初始化ModelScope服务
          this.initializeModelScopeService(apiKey);

          if (!this.modelScopeService) {
            throw new Error('ModelScope服务初始化失败');
          }

          // 分析文章内容
          const analysis = this.contentAnalyzer.analyzeArticle(articleText, title);

          // 批量生成图片
          const results: ImageGenerationResult[] = [];

          for (const requirement of analysis.imageRequirements) {
            try {
              const imageUrl = await this.modelScopeService.generateImage({
                prompt: requirement.prompt || requirement.description
              });

              results.push({
                requirement,
                imageUrl,
                generatedAt: new Date(),
                success: true
              });
            } catch (error) {
              results.push({
                requirement,
                imageUrl: '',
                generatedAt: new Date(),
                success: false,
                error: error instanceof Error ? error.message : '未知错误'
              });
            }
          }

          // 格式化结果
          const successCount = results.filter(r => r.success).length;
          const resultText = `文章配图生成完成！\n\n文章：${analysis.title}\n主题：${analysis.topic}\n成功生成 ${successCount}/${results.length} 张配图：\n\n${results
            .map((result, index) => {
              if (result.success) {
                return `✅ ${index + 1}. ${result.requirement.description}\n   URL：${result.imageUrl}`;
              } else {
                return `❌ ${index + 1}. ${result.requirement.description}\n   错误：${result.error}`;
              }
            })
            .join('\n\n')}`;

          return {
            content: [
              {
                type: 'text',
                text: resultText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `批量生成文章配图失败：${error instanceof Error ? error.message : '未知错误'}`
              }
            ]
          };
        }
      }
    );

    // 6. 验证API密钥工具
    this.server.registerTool(
      'validate-api-key',
      {
        title: '验证ModelScope API密钥',
        description: '验证提供的ModelScope API密钥是否有效',
        inputSchema: {
          apiKey: z.string().describe('要验证的ModelScope API密钥')
        }
      },
      async ({ apiKey }) => {
        try {
          // 初始化ModelScope服务
          this.initializeModelScopeService(apiKey);

          if (!this.modelScopeService) {
            throw new Error('ModelScope服务初始化失败');
          }

          // 验证API密钥
          const isValid = await this.modelScopeService.validateApiKey();

          return {
            content: [
              {
                type: 'text',
                text: isValid ? '✅ API密钥验证成功，可以正常使用' : '❌ API密钥无效或权限不足'
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `验证API密钥时发生错误：${error instanceof Error ? error.message : '未知错误'}`
              }
            ]
          };
        }
      }
    );
  }

  /**
   * 注册MCP资源
   */
  private registerResources(): void {
    // 提供图片类型模板资源
    this.server.registerResource(
      'image-type-templates',
      'templates://image-types',
      {
        title: '图片类型模板',
        description: '提供各种图片类型的提示词模板和尺寸建议',
        mimeType: 'application/json'
      },
      async () => {
        const templates = {
          hero: {
            description: '英雄横幅图片',
            suggestedSize: '1920x1080',
            promptTemplate: 'professional hero banner image, modern design, clean composition'
          },
          banner: {
            description: '网站横幅图片',
            suggestedSize: '1200x400',
            promptTemplate: 'website banner design, professional layout, corporate style'
          },
          icon: {
            description: '图标',
            suggestedSize: '64x64',
            promptTemplate: 'simple icon design, minimalist style, clean lines, vector-like'
          },
          illustration: {
            description: '插图',
            suggestedSize: '800x600',
            promptTemplate: 'digital illustration, modern art style, vibrant colors'
          },
          product: {
            description: '产品图片',
            suggestedSize: '800x600',
            promptTemplate: 'product photography style, professional lighting, clean background'
          },
          avatar: {
            description: '头像',
            suggestedSize: '128x128',
            promptTemplate: 'professional avatar, clean portrait style, modern design'
          },
          background: {
            description: '背景图片',
            suggestedSize: '1920x1080',
            promptTemplate: 'subtle background pattern, professional design, clean aesthetic'
          }
        };

        return {
          contents: [
            {
              uri: 'templates://image-types',
              text: JSON.stringify(templates, null, 2),
              mimeType: 'application/json'
            }
          ]
        };
      }
    );

    // 提供使用指南资源
    this.server.registerResource(
      'usage-guide',
      'guide://usage',
      {
        title: '使用指南',
        description: 'AI图片生成MCP Server的详细使用指南',
        mimeType: 'text/markdown'
      },
      async () => {
        const guide = `
# AI图片生成MCP Server使用指南

## 概述
本MCP Server提供智能图片生成服务，能够自动分析网页和文章内容，生成合适的占位图片。

## 主要功能

### 1. 网页图片生成
- **analyze-webpage-images**: 分析网页HTML，识别图片需求
- **generate-webpage-images**: 批量生成网页所需的所有图片

### 2. 文章配图生成
- **analyze-article-images**: 分析文章内容，生成配图建议
- **generate-article-images**: 批量生成文章配图

### 3. 单独图片生成
- **generate-single-image**: 使用自定义提示词生成单张图片

### 4. 工具功能
- **validate-api-key**: 验证ModelScope API密钥

## 使用步骤

1. 准备ModelScope API密钥
2. 选择合适的工具
3. 提供相应的输入参数
4. 获取生成的图片URL

## 注意事项
- API密钥需要有效的ModelScope账户
- 图片生成可能需要一定时间
- 建议使用英文提示词以获得最佳效果
        `;

        return {
          contents: [
            {
              uri: 'guide://usage',
              text: guide.trim(),
              mimeType: 'text/markdown'
            }
          ]
        };
      }
    );
  }

  /**
   * 初始化ModelScope服务
   * @param apiKey API密钥
   */
  private initializeModelScopeService(apiKey: string): void {
    const config: ModelScopeConfig = {
      apiKey,
      endpoint: 'https://api-inference.modelscope.cn/v1/images/generations',
      modelId: 'MusePublic/489_ckpt_FLUX_1'
    };

    this.modelScopeService = new ModelScopeService(config);
  }

  /**
   * 启动MCP服务器
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AI图片生成MCP Server已启动，等待客户端连接...');
  }
}

/**
 * 主函数 - 启动服务器
 */
async function main(): Promise<void> {
  try {
    const server = new AIImageGenerationServer();
    await server.start();
  } catch (error) {
    console.error('启动服务器时发生错误:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', error => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
