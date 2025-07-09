/**
 * ModelScope API服务类
 * 负责调用ModelScope的FLUX模型生成图片
 */

import axios, { AxiosResponse } from 'axios';
import type {
  ModelScopeConfig,
  ImageGenerationRequest,
  ModelScopeResponse,
  ImageGenerationError
} from '../types.js';

export class ModelScopeService {
  private config: ModelScopeConfig;

  /**
   * 构造函数
   * @param config ModelScope配置信息
   */
  constructor(config: ModelScopeConfig) {
    this.config = {
      ...config,
      endpoint: config.endpoint || 'https://api-inference.modelscope.cn/v1/images/generations',
      modelId: config.modelId || 'MusePublic/489_ckpt_FLUX_1'
    };
  }

  /**
   * 生成图片
   * @param request 图片生成请求参数
   * @returns 生成的图片URL
   */
  async generateImage(request: ImageGenerationRequest): Promise<string> {
    try {
      // 构造请求体
      const payload = {
        model: this.config.modelId,
        prompt: request.prompt
      };

      // 构造请求头
      const headers = {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      };

      // 发送API请求
      const response: AxiosResponse<ModelScopeResponse> = await axios.post(
        this.config.endpoint,
        payload,
        { headers }
      );

      // 检查响应状态
      if (response.status !== 200) {
        throw new Error(`API请求失败，状态码: ${response.status}`);
      }

      // 提取图片URL
      const imageData = response.data;
      if (!imageData.images || imageData.images.length === 0) {
        throw new Error('API响应中没有找到生成的图片');
      }

      return imageData.images[0].url;
    } catch (error) {
      // 错误处理
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 0;
        const errorMessage = error.response?.data?.error?.message || error.message;

        throw new Error(`ModelScope API调用失败 (${statusCode}): ${errorMessage}`);
      }

      throw new Error(`图片生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量生成图片
   * @param requests 图片生成请求数组
   * @returns 生成的图片URL数组
   */
  async generateImages(requests: ImageGenerationRequest[]): Promise<string[]> {
    const results: string[] = [];

    // 并发生成图片（限制并发数量避免API限流）
    const CONCURRENT_LIMIT = 3;

    for (let i = 0; i < requests.length; i += CONCURRENT_LIMIT) {
      const batch = requests.slice(i, i + CONCURRENT_LIMIT);
      const batchPromises = batch.map(request => this.generateImage(request));

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        // 如果批次中有失败的，记录错误但继续处理其他批次
        console.error(`批次 ${Math.floor(i / CONCURRENT_LIMIT) + 1} 生成失败:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * 验证API密钥是否有效
   * @returns 是否有效
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // 使用简单的测试提示词验证API密钥
      await this.generateImage({
        prompt: 'A simple test image'
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 更新配置
   * @param newConfig 新的配置信息
   */
  updateConfig(newConfig: Partial<ModelScopeConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
