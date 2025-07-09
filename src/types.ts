/**
 * AI图片生成MCP Server类型定义
 * 遵循PEP8规范并提供详细的中文注释
 */

// ModelScope API相关类型定义
export interface ModelScopeConfig {
  /** API密钥，由客户端传入 */
  apiKey: string;
  /** API端点URL */
  endpoint: string;
  /** 模型ID */
  modelId: string;
}

// 图片生成请求参数
export interface ImageGenerationRequest {
  /** 生成图片的英文提示词 */
  prompt: string;
  /** 图片数量，默认为1 */
  count?: number;
  /** 图片尺寸，默认为512x512 */
  size?: string;
}

// ModelScope API响应格式
export interface ModelScopeResponse {
  /** 生成的图片信息数组 */
  images: Array<{
    /** 图片URL地址 */
    url: string;
    /** 图片索引 */
    index?: number;
  }>;
  /** 请求ID */
  request_id?: string;
}

// 网页分析结果
export interface WebPageAnalysis {
  /** 页面标题 */
  title: string;
  /** 页面主要内容 */
  content: string;
  /** 检测到的图片需求 */
  imageRequirements: ImageRequirement[];
}

// 图片需求定义
export interface ImageRequirement {
  /** 图片类型（如：hero, banner, icon, illustration等） */
  type: string;
  /** 图片描述 */
  description: string;
  /** 建议的图片尺寸 */
  suggestedSize: string;
  /** 在页面中的位置或用途 */
  context: string;
  /** 生成的英文prompt */
  prompt?: string;
}

// 图片生成结果
export interface ImageGenerationResult {
  /** 图片需求信息 */
  requirement: ImageRequirement;
  /** 生成的图片URL */
  imageUrl: string;
  /** 生成时间 */
  generatedAt: Date;
  /** 是否生成成功 */
  success: boolean;
  /** 错误信息（如果生成失败） */
  error?: string;
}

// 文章分析结果
export interface ArticleAnalysis {
  /** 文章标题 */
  title: string;
  /** 文章段落 */
  paragraphs: string[];
  /** 文章主题 */
  topic: string;
  /** 建议的配图数量 */
  suggestedImageCount: number;
  /** 图片需求列表 */
  imageRequirements: ImageRequirement[];
}

// 错误类型定义
export class ImageGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ImageGenerationError';
  }
}
