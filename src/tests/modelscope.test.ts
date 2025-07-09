/**
 * ModelScope API服务单元测试
 * 测试图片生成API调用功能
 */

import axios from 'axios';
import { ModelScopeService } from '../services/modelscope';
import type { ModelScopeConfig, ImageGenerationRequest } from '../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ModelScopeService', () => {
  let service: ModelScopeService;
  let mockConfig: ModelScopeConfig;

  beforeEach(() => {
    mockConfig = {
      apiKey: 'test-api-key',
      endpoint: 'https://api-inference.modelscope.cn/v1/images/generations',
      modelId: 'MusePublic/489_ckpt_FLUX_1'
    };

    service = new ModelScopeService(mockConfig);

    // 清除所有mock调用
    jest.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该使用提供的配置初始化服务', () => {
      const customConfig: ModelScopeConfig = {
        apiKey: 'custom-key',
        endpoint: 'https://custom-endpoint.com',
        modelId: 'custom-model'
      };

      const customService = new ModelScopeService(customConfig);

      expect(customService).toBeDefined();
    });

    it('应该使用默认配置补充缺失的值', () => {
      const minimalConfig: ModelScopeConfig = {
        apiKey: 'test-key',
        endpoint: '',
        modelId: ''
      };

      const serviceWithDefaults = new ModelScopeService(minimalConfig);

      expect(serviceWithDefaults).toBeDefined();
    });
  });

  describe('generateImage', () => {
    it('应该成功生成单张图片', async () => {
      // 模拟成功的API响应
      const mockResponse = {
        status: 200,
        data: {
          images: [{ url: 'https://example.com/generated-image.jpg', index: 0 }],
          request_id: 'req-123'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request: ImageGenerationRequest = {
        prompt: 'A beautiful sunset over mountains'
      };

      const result = await service.generateImage(request);

      expect(result).toBe('https://example.com/generated-image.jpg');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockConfig.endpoint,
        {
          model: mockConfig.modelId,
          prompt: request.prompt
        },
        {
          headers: {
            Authorization: `Bearer ${mockConfig.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('应该处理API错误响应', async () => {
      // 模拟API错误响应
      const mockError = {
        response: {
          status: 401,
          data: {
            error: {
              message: 'Invalid API key'
            }
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const request: ImageGenerationRequest = {
        prompt: 'Test prompt'
      };

      await expect(service.generateImage(request)).rejects.toThrow(
        'ModelScope API调用失败 (401): Invalid API key'
      );
    });

    it('应该处理网络错误', async () => {
      // 模拟网络错误
      const networkError = new Error('Network Error');
      mockedAxios.post.mockRejectedValueOnce(networkError);

      const request: ImageGenerationRequest = {
        prompt: 'Test prompt'
      };

      await expect(service.generateImage(request)).rejects.toThrow('图片生成失败: Network Error');
    });

    it('应该处理空响应', async () => {
      // 模拟空响应
      const mockResponse = {
        status: 200,
        data: {
          images: [],
          request_id: 'req-123'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request: ImageGenerationRequest = {
        prompt: 'Test prompt'
      };

      await expect(service.generateImage(request)).rejects.toThrow('API响应中没有找到生成的图片');
    });

    it('应该处理非200状态码', async () => {
      // 模拟非200状态码
      const mockResponse = {
        status: 500,
        data: {}
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request: ImageGenerationRequest = {
        prompt: 'Test prompt'
      };

      await expect(service.generateImage(request)).rejects.toThrow('API请求失败，状态码: 500');
    });
  });

  describe('generateImages (批量生成)', () => {
    it('应该成功批量生成多张图片', async () => {
      // 模拟多个成功的API响应
      const mockResponses = [
        {
          status: 200,
          data: {
            images: [{ url: 'https://example.com/image1.jpg' }]
          }
        },
        {
          status: 200,
          data: {
            images: [{ url: 'https://example.com/image2.jpg' }]
          }
        }
      ];

      mockedAxios.post
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      const requests: ImageGenerationRequest[] = [
        { prompt: 'First image prompt' },
        { prompt: 'Second image prompt' }
      ];

      const results = await service.generateImages(requests);

      expect(results).toHaveLength(2);
      expect(results[0]).toBe('https://example.com/image1.jpg');
      expect(results[1]).toBe('https://example.com/image2.jpg');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('应该处理批量生成中的部分失败', async () => {
      // 模拟一个成功一个失败的响应
      const successResponse = {
        status: 200,
        data: {
          images: [{ url: 'https://example.com/image1.jpg' }]
        }
      };

      const errorResponse = {
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(successResponse).mockRejectedValueOnce(errorResponse);

      const requests: ImageGenerationRequest[] = [
        { prompt: 'First prompt' },
        { prompt: 'Second prompt' }
      ];

      // 批量生成应该在遇到错误时抛出异常
      await expect(service.generateImages(requests)).rejects.toThrow();
    });

    it('应该正确处理并发限制', async () => {
      // 创建5个请求来测试并发限制
      const requests: ImageGenerationRequest[] = Array.from({ length: 5 }, (_, i) => ({
        prompt: `Prompt ${i + 1}`
      }));

      // 模拟所有请求成功
      const mockResponse = {
        status: 200,
        data: {
          images: [{ url: 'https://example.com/image.jpg' }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const results = await service.generateImages(requests);

      expect(results).toHaveLength(5);
      expect(mockedAxios.post).toHaveBeenCalledTimes(5);
    });

    it('应该处理空请求数组', async () => {
      const results = await service.generateImages([]);

      expect(results).toHaveLength(0);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('validateApiKey', () => {
    it('应该对有效的API密钥返回true', async () => {
      // 模拟成功的验证响应
      const mockResponse = {
        status: 200,
        data: {
          images: [{ url: 'https://example.com/test-image.jpg' }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const isValid = await service.validateApiKey();

      expect(isValid).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockConfig.endpoint,
        {
          model: mockConfig.modelId,
          prompt: 'A simple test image'
        },
        {
          headers: {
            Authorization: `Bearer ${mockConfig.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('应该对无效的API密钥返回false', async () => {
      // 模拟认证失败
      const mockError = {
        response: {
          status: 401,
          data: { error: { message: 'Invalid API key' } }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const isValid = await service.validateApiKey();

      expect(isValid).toBe(false);
    });

    it('应该对网络错误返回false', async () => {
      // 模拟网络错误
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

      const isValid = await service.validateApiKey();

      expect(isValid).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('应该正确更新配置', () => {
      const newConfig = {
        apiKey: 'new-api-key',
        modelId: 'new-model-id'
      };

      service.updateConfig(newConfig);

      // 验证配置是否已更新（通过检查后续API调用）
      const mockResponse = {
        status: 200,
        data: {
          images: [{ url: 'https://example.com/image.jpg' }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      return service.generateImage({ prompt: 'test' }).then(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          mockConfig.endpoint,
          {
            model: 'new-model-id',
            prompt: 'test'
          },
          {
            headers: {
              Authorization: 'Bearer new-api-key',
              'Content-Type': 'application/json'
            }
          }
        );
      });
    });

    it('应该只更新提供的配置字段', () => {
      const originalApiKey = mockConfig.apiKey;

      // 只更新模型ID
      service.updateConfig({ modelId: 'updated-model' });

      const mockResponse = {
        status: 200,
        data: {
          images: [{ url: 'https://example.com/image.jpg' }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      return service.generateImage({ prompt: 'test' }).then(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          mockConfig.endpoint,
          {
            model: 'updated-model',
            prompt: 'test'
          },
          {
            headers: {
              Authorization: `Bearer ${originalApiKey}`, // 应该保持原来的API密钥
              'Content-Type': 'application/json'
            }
          }
        );
      });
    });
  });

  describe('错误边界情况', () => {
    it('应该处理undefined响应数据', async () => {
      const mockResponse = {
        status: 200,
        data: undefined
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request: ImageGenerationRequest = {
        prompt: 'Test prompt'
      };

      await expect(service.generateImage(request)).rejects.toThrow();
    });

    it('应该处理格式错误的响应数据', async () => {
      const mockResponse = {
        status: 200,
        data: {
          images: null
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request: ImageGenerationRequest = {
        prompt: 'Test prompt'
      };

      await expect(service.generateImage(request)).rejects.toThrow('API响应中没有找到生成的图片');
    });

    it('应该处理非常长的提示词', async () => {
      const mockResponse = {
        status: 200,
        data: {
          images: [{ url: 'https://example.com/image.jpg' }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const longPrompt = 'A'.repeat(10000); // 非常长的提示词
      const request: ImageGenerationRequest = {
        prompt: longPrompt
      };

      const result = await service.generateImage(request);

      expect(result).toBe('https://example.com/image.jpg');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockConfig.endpoint,
        {
          model: mockConfig.modelId,
          prompt: longPrompt
        },
        expect.any(Object)
      );
    });
  });
});
