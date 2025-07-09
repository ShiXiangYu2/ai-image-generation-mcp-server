/**
 * 内容分析服务类
 * 负责分析网页内容和文章，识别图片需求并生成合适的提示词
 */

import * as cheerio from 'cheerio';
import type { WebPageAnalysis, ArticleAnalysis, ImageRequirement } from '../types.js';

export class ContentAnalyzer {
  // 常见的图片类型和对应的提示词模板
  private readonly imageTypeTemplates = {
    hero: 'professional hero banner image, modern design, clean composition',
    banner: 'website banner design, professional layout, corporate style',
    icon: 'simple icon design, minimalist style, clean lines, vector-like',
    illustration: 'digital illustration, modern art style, vibrant colors',
    background: 'subtle background pattern, professional design, clean aesthetic',
    product: 'product photography style, professional lighting, clean background',
    avatar: 'professional avatar, clean portrait style, modern design',
    logo: 'professional logo design, minimalist style, brand identity',
    thumbnail: 'engaging thumbnail image, eye-catching design, clear composition'
  };

  // 网页元素到图片类型的映射
  private readonly elementToImageType = {
    header: 'hero',
    banner: 'banner',
    nav: 'logo',
    sidebar: 'thumbnail',
    article: 'illustration',
    section: 'background',
    footer: 'icon'
  };

  /**
   * 分析网页HTML内容
   * @param htmlContent 网页HTML内容
   * @param pageUrl 页面URL（可选）
   * @returns 网页分析结果
   */
  analyzeWebPage(htmlContent: string, pageUrl?: string): WebPageAnalysis {
    const $ = cheerio.load(htmlContent);

    // 提取页面基本信息
    const title = $('title').text().trim() || $('h1').first().text().trim() || '未知页面';
    const content = this.extractTextContent($);

    // 识别图片需求
    const imageRequirements = this.identifyImageRequirements($, content, title);

    return {
      title,
      content,
      imageRequirements
    };
  }

  /**
   * 分析文章内容
   * @param articleText 文章文本内容
   * @param title 文章标题（可选）
   * @returns 文章分析结果
   */
  analyzeArticle(articleText: string, title?: string): ArticleAnalysis {
    // 分割文章段落
    const paragraphs = articleText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // 提取或生成标题
    const articleTitle = title || paragraphs[0] || '未知文章';

    // 识别文章主题
    const topic = this.identifyArticleTopic(articleText, articleTitle);

    // 计算建议的配图数量
    const suggestedImageCount = this.calculateSuggestedImageCount(paragraphs);

    // 生成图片需求
    const imageRequirements = this.generateArticleImageRequirements(
      paragraphs,
      articleTitle,
      topic,
      suggestedImageCount
    );

    return {
      title: articleTitle,
      paragraphs,
      topic,
      suggestedImageCount,
      imageRequirements
    };
  }

  /**
   * 提取页面文本内容
   * @param $ Cheerio实例
   * @returns 页面主要文本内容
   */
  private extractTextContent($: cheerio.CheerioAPI): string {
    // 移除脚本和样式标签
    $('script, style').remove();

    // 提取主要内容
    const mainContent = $('main, article, .content, .main-content, body').first();
    const text = mainContent.text() || $('body').text();

    // 清理和格式化文本
    return text.replace(/\s+/g, ' ').trim().substring(0, 2000); // 限制长度以便后续处理
  }

  /**
   * 识别网页图片需求
   * @param $ Cheerio实例
   * @param content 页面内容
   * @param title 页面标题
   * @returns 图片需求数组
   */
  private identifyImageRequirements(
    $: cheerio.CheerioAPI,
    content: string,
    title: string
  ): ImageRequirement[] {
    const requirements: ImageRequirement[] = [];

    // 检查现有的img标签和占位符
    $('img, [data-placeholder], .placeholder, .image-placeholder').each((_, element) => {
      const $el = $(element);
      const alt = $el.attr('alt') || '';
      const className = $el.attr('class') || '';
      const parentContext = $el.parent().prop('tagName')?.toLowerCase() || '';

      // 确定图片类型
      const imageType = this.determineImageType(alt, className, parentContext);

      // 生成图片需求
      const requirement: ImageRequirement = {
        type: imageType,
        description: alt || this.generateDescriptionFromContext(parentContext, title),
        suggestedSize: this.getSuggestedSize(imageType),
        context: this.getContextDescription(parentContext, className),
        prompt: this.generatePrompt(imageType, alt, title, content)
      };

      requirements.push(requirement);
    });

    // 如果没有找到现有的图片标签，基于页面结构生成建议
    if (requirements.length === 0) {
      requirements.push(...this.generateDefaultRequirements(title, content));
    }

    return requirements;
  }

  /**
   * 确定图片类型
   * @param alt 图片alt属性
   * @param className CSS类名
   * @param parentContext 父元素上下文
   * @returns 图片类型
   */
  private determineImageType(alt: string, className: string, parentContext: string): string {
    const combinedText = `${alt} ${className} ${parentContext}`.toLowerCase();

    // 关键词匹配
    if (combinedText.includes('hero') || combinedText.includes('banner')) return 'hero';
    if (combinedText.includes('icon')) return 'icon';
    if (combinedText.includes('logo')) return 'logo';
    if (combinedText.includes('avatar') || combinedText.includes('profile')) return 'avatar';
    if (combinedText.includes('product')) return 'product';
    if (combinedText.includes('background')) return 'background';
    if (combinedText.includes('thumbnail')) return 'thumbnail';

    // 基于父元素确定类型
    return (
      this.elementToImageType[parentContext as keyof typeof this.elementToImageType] ||
      'illustration'
    );
  }

  /**
   * 生成图片提示词
   * @param imageType 图片类型
   * @param description 图片描述
   * @param title 页面标题
   * @param content 页面内容
   * @returns 英文提示词
   */
  private generatePrompt(
    imageType: string,
    description: string,
    title: string,
    content: string
  ): string {
    // 获取基础模板
    const baseTemplate =
      this.imageTypeTemplates[imageType as keyof typeof this.imageTypeTemplates] ||
      'professional image, modern design, clean composition';

    // 提取关键词
    const keywords = this.extractKeywords(description, title, content);

    // 组合提示词
    let prompt = baseTemplate;
    if (keywords.length > 0) {
      prompt += `, ${keywords.slice(0, 3).join(', ')}`;
    }

    // 添加质量修饰符
    prompt += ', high quality, professional, detailed';

    return prompt;
  }

  /**
   * 提取关键词
   * @param text 文本内容
   * @returns 关键词数组
   */
  private extractKeywords(...texts: string[]): string[] {
    const combinedText = texts.join(' ').toLowerCase();
    const words = combinedText.match(/\b[a-z]{3,}\b/g) || [];

    // 过滤常见停用词
    const stopWords = new Set([
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'this',
      'that',
      'these',
      'those',
      'is',
      'are',
      'was',
      'were',
      'been',
      'being',
      'have',
      'has',
      'had',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might'
    ]);

    return words
      .filter(word => !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // 去重
      .slice(0, 10); // 限制数量
  }

  /**
   * 获取建议的图片尺寸
   * @param imageType 图片类型
   * @returns 建议尺寸
   */
  private getSuggestedSize(imageType: string): string {
    const sizeMap: Record<string, string> = {
      hero: '1920x1080',
      banner: '1200x400',
      icon: '64x64',
      logo: '200x100',
      avatar: '128x128',
      product: '800x600',
      background: '1920x1080',
      thumbnail: '300x200',
      illustration: '800x600'
    };

    return sizeMap[imageType] || '800x600';
  }

  /**
   * 生成上下文描述
   * @param parentContext 父元素上下文
   * @param className CSS类名
   * @returns 上下文描述
   */
  private getContextDescription(parentContext: string, className: string): string {
    if (parentContext === 'header') return '页面头部';
    if (parentContext === 'footer') return '页面底部';
    if (parentContext === 'nav') return '导航区域';
    if (parentContext === 'main') return '主要内容区域';
    if (parentContext === 'aside') return '侧边栏';
    if (className.includes('hero')) return '英雄区域';
    if (className.includes('banner')) return '横幅区域';

    return '内容区域';
  }

  /**
   * 从上下文生成描述
   * @param context 上下文
   * @param title 页面标题
   * @returns 描述文本
   */
  private generateDescriptionFromContext(context: string, title: string): string {
    const contextMap: Record<string, string> = {
      header: `${title}页面的头部图片`,
      banner: `${title}的横幅图片`,
      nav: `${title}的导航图标`,
      main: `${title}的主要内容图片`,
      footer: `${title}的页脚图标`
    };

    return contextMap[context] || `${title}相关图片`;
  }

  /**
   * 生成默认图片需求
   * @param title 页面标题
   * @param content 页面内容
   * @returns 默认图片需求数组
   */
  private generateDefaultRequirements(title: string, content: string): ImageRequirement[] {
    // 为常见的网页结构生成默认需求
    return [
      {
        type: 'hero',
        description: `${title}的主要横幅图片`,
        suggestedSize: '1920x1080',
        context: '页面头部英雄区域',
        prompt: this.generatePrompt('hero', '', title, content)
      },
      {
        type: 'illustration',
        description: `${title}的内容配图`,
        suggestedSize: '800x600',
        context: '主要内容区域',
        prompt: this.generatePrompt('illustration', '', title, content)
      }
    ];
  }

  /**
   * 识别文章主题
   * @param articleText 文章文本
   * @param title 文章标题
   * @returns 文章主题
   */
  private identifyArticleTopic(articleText: string, title: string): string {
    const text = `${title} ${articleText}`.toLowerCase();

    // 主题关键词映射
    const topicKeywords = {
      technology: [
        'tech',
        'software',
        'programming',
        'code',
        'development',
        'ai',
        'machine learning'
      ],
      business: ['business', 'marketing', 'strategy', 'management', 'finance', 'economy'],
      lifestyle: ['lifestyle', 'health', 'fitness', 'food', 'travel', 'fashion'],
      education: ['education', 'learning', 'tutorial', 'guide', 'how to', 'course'],
      science: ['science', 'research', 'study', 'analysis', 'experiment', 'data']
    };

    // 计算每个主题的匹配分数
    const scores: Record<string, number> = {};
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      scores[topic] = keywords.filter(keyword => text.includes(keyword)).length;
    }

    // 返回分数最高的主题
    const topTopic = Object.entries(scores).reduce((a, b) => (scores[a[0]] > scores[b[0]] ? a : b));
    return topTopic[1] > 0 ? topTopic[0] : 'general';
  }

  /**
   * 计算建议的配图数量
   * @param paragraphs 文章段落
   * @returns 建议的配图数量
   */
  private calculateSuggestedImageCount(paragraphs: string[]): number {
    const totalLength = paragraphs.join(' ').length;

    // 基于文章长度计算建议配图数量
    if (totalLength < 500) return 1;
    if (totalLength < 1500) return 2;
    if (totalLength < 3000) return 3;
    return Math.min(5, Math.ceil(totalLength / 1000));
  }

  /**
   * 生成文章图片需求
   * @param paragraphs 文章段落
   * @param title 文章标题
   * @param topic 文章主题
   * @param count 需要的图片数量
   * @returns 图片需求数组
   */
  private generateArticleImageRequirements(
    paragraphs: string[],
    title: string,
    topic: string,
    count: number
  ): ImageRequirement[] {
    const requirements: ImageRequirement[] = [];

    // 生成主题相关的提示词前缀
    const topicPrompts = {
      technology: 'modern technology concept, digital innovation',
      business: 'professional business concept, corporate environment',
      lifestyle: 'lifestyle concept, everyday life, human interest',
      education: 'educational concept, learning environment, knowledge',
      science: 'scientific concept, research environment, academic',
      general: 'conceptual illustration, modern design'
    };

    const topicPrompt = topicPrompts[topic as keyof typeof topicPrompts] || topicPrompts.general;

    // 生成配图需求
    for (let i = 0; i < count; i++) {
      const isFirst = i === 0;
      const requirement: ImageRequirement = {
        type: isFirst ? 'hero' : 'illustration',
        description: isFirst ? `${title}的主要配图` : `${title}的第${i}张配图`,
        suggestedSize: isFirst ? '1200x800' : '800x600',
        context: isFirst ? '文章开头' : `第${i + 1}段附近`,
        prompt: `${topicPrompt}, ${title.toLowerCase()}, high quality, professional illustration`
      };

      requirements.push(requirement);
    }

    return requirements;
  }
}
