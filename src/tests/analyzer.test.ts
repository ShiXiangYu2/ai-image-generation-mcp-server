/**
 * 内容分析器单元测试
 * 测试网页和文章内容分析功能
 */

import { ContentAnalyzer } from '../services/analyzer';
import type { WebPageAnalysis, ArticleAnalysis } from '../types';

describe('ContentAnalyzer', () => {
  let analyzer: ContentAnalyzer;

  beforeEach(() => {
    analyzer = new ContentAnalyzer();
  });

  describe('analyzeWebPage', () => {
    it('应该正确分析包含图片标签的网页', () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head><title>测试页面</title></head>
          <body>
            <header>
              <img src="placeholder.jpg" alt="网站logo" class="logo">
            </header>
            <main>
              <h1>欢迎来到我们的网站</h1>
              <img src="hero.jpg" alt="主要横幅图片" class="hero-image">
              <p>这里是主要内容。</p>
            </main>
          </body>
        </html>
      `;

      const analysis: WebPageAnalysis = analyzer.analyzeWebPage(htmlContent);

      expect(analysis.title).toBe('测试页面');
      expect(analysis.imageRequirements).toHaveLength(2);

      // 检查第一个图片需求（logo）
      const logoRequirement = analysis.imageRequirements.find(req =>
        req.description.includes('logo')
      );
      expect(logoRequirement).toBeDefined();
      expect(logoRequirement?.type).toBe('logo');

      // 检查第二个图片需求（hero）
      const heroRequirement = analysis.imageRequirements.find(req =>
        req.description.includes('横幅')
      );
      expect(heroRequirement).toBeDefined();
      expect(heroRequirement?.type).toBe('hero');
    });

    it('应该为没有图片标签的网页生成默认需求', () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head><title>简单页面</title></head>
          <body>
            <h1>标题</h1>
            <p>这是一个没有图片的简单页面。</p>
          </body>
        </html>
      `;

      const analysis: WebPageAnalysis = analyzer.analyzeWebPage(htmlContent);

      expect(analysis.title).toBe('简单页面');
      expect(analysis.imageRequirements.length).toBeGreaterThan(0);

      // 应该包含默认的hero图片需求
      const heroRequirement = analysis.imageRequirements.find(req => req.type === 'hero');
      expect(heroRequirement).toBeDefined();
    });

    it('应该正确处理占位符元素', () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head><title>占位符测试</title></head>
          <body>
            <div class="image-placeholder" data-type="banner"></div>
            <div class="placeholder icon-placeholder"></div>
          </body>
        </html>
      `;

      const analysis: WebPageAnalysis = analyzer.analyzeWebPage(htmlContent);

      expect(analysis.imageRequirements.length).toBeGreaterThanOrEqual(1);

      // 检查是否正确识别了占位符
      const requirements = analysis.imageRequirements;
      expect(requirements.some(req => req.type === 'banner' || req.type === 'icon')).toBeTruthy();
    });
  });

  describe('analyzeArticle', () => {
    it('应该正确分析短文章', () => {
      const articleText = `
        人工智能的发展趋势
        
        人工智能正在快速发展，影响着我们生活的方方面面。
        
        从机器学习到深度学习，技术不断进步。
        
        未来，AI将在更多领域发挥重要作用。
      `;

      const analysis: ArticleAnalysis = analyzer.analyzeArticle(articleText);

      expect(analysis.title).toBe('人工智能的发展趋势');
      expect(analysis.topic).toBe('technology');
      expect(analysis.suggestedImageCount).toBeGreaterThan(0);
      expect(analysis.imageRequirements).toHaveLength(analysis.suggestedImageCount);

      // 第一张图片应该是hero类型
      expect(analysis.imageRequirements[0].type).toBe('hero');
    });

    it('应该正确分析长文章并建议合适的配图数量', () => {
      const longArticleText = 'A'.repeat(2000); // 2000字符的长文章

      const analysis: ArticleAnalysis = analyzer.analyzeArticle(longArticleText, '长文章测试');

      expect(analysis.title).toBe('长文章测试');
      expect(analysis.suggestedImageCount).toBeGreaterThan(1);
      expect(analysis.imageRequirements).toHaveLength(analysis.suggestedImageCount);
    });

    it('应该正确识别商业主题文章', () => {
      const businessArticleText = `
        企业营销策略分析
        
        在当今竞争激烈的商业环境中，制定有效的营销策略至关重要。
        
        企业需要了解市场趋势，分析竞争对手，制定差异化策略。
        
        通过数据分析和市场调研，企业可以制定更好的商业计划。
      `;

      const analysis: ArticleAnalysis = analyzer.analyzeArticle(businessArticleText);

      expect(analysis.topic).toBe('business');
      expect(
        analysis.imageRequirements.every(
          req => req.prompt?.includes('business') || req.prompt?.includes('corporate')
        )
      ).toBeTruthy();
    });

    it('应该正确识别生活方式主题文章', () => {
      const lifestyleArticleText = `
        健康饮食的重要性
        
        保持健康的饮食习惯对我们的身体非常重要。
        
        多吃蔬菜水果，少吃油腻食物，可以让我们更健康。
        
        适量运动配合健康饮食，能够提高生活质量。
      `;

      const analysis: ArticleAnalysis = analyzer.analyzeArticle(lifestyleArticleText);

      expect(analysis.topic).toBe('lifestyle');
      expect(
        analysis.imageRequirements.every(
          req => req.prompt?.includes('lifestyle') || req.prompt?.includes('health')
        )
      ).toBeTruthy();
    });

    it('应该处理空文章', () => {
      const analysis: ArticleAnalysis = analyzer.analyzeArticle('');

      expect(analysis.title).toBe('未知文章');
      expect(analysis.paragraphs).toHaveLength(0);
      expect(analysis.suggestedImageCount).toBe(1);
      expect(analysis.imageRequirements).toHaveLength(1);
    });
  });

  describe('生成的提示词质量', () => {
    it('应该生成包含关键词的英文提示词', () => {
      const htmlContent = `
        <html>
          <head><title>Technology Blog</title></head>
          <body>
            <img alt="AI and machine learning concept" class="hero-image">
          </body>
        </html>
      `;

      const analysis: WebPageAnalysis = analyzer.analyzeWebPage(htmlContent);
      const requirement = analysis.imageRequirements[0];

      expect(requirement.prompt).toBeDefined();
      expect(requirement.prompt).toMatch(/\b(professional|modern|clean|high quality)\b/i);
      expect(typeof requirement.prompt).toBe('string');
      expect(requirement.prompt!.length).toBeGreaterThan(10);
    });

    it('应该为不同图片类型生成不同的提示词', () => {
      const htmlContent = `
        <html>
          <body>
            <img alt="company logo" class="logo">
            <img alt="hero banner" class="hero">
            <img alt="product image" class="product">
          </body>
        </html>
      `;

      const analysis: WebPageAnalysis = analyzer.analyzeWebPage(htmlContent);

      // 不同类型的图片应该有不同的提示词
      const prompts = analysis.imageRequirements.map(req => req.prompt);
      const uniquePrompts = new Set(prompts);

      expect(uniquePrompts.size).toBeGreaterThan(1);
    });
  });

  describe('边界情况处理', () => {
    it('应该处理格式错误的HTML', () => {
      const malformedHtml = '<html><body><img alt="test"</body>';

      expect(() => {
        analyzer.analyzeWebPage(malformedHtml);
      }).not.toThrow();
    });

    it('应该处理包含特殊字符的内容', () => {
      const htmlWithSpecialChars = `
        <html>
          <body>
            <img alt="测试图片 & 特殊字符 < > &quot;">
          </body>
        </html>
      `;

      const analysis: WebPageAnalysis = analyzer.analyzeWebPage(htmlWithSpecialChars);

      expect(analysis.imageRequirements).toHaveLength(1);
      expect(analysis.imageRequirements[0].description).toContain('测试图片');
    });

    it('应该处理非常长的文本内容', () => {
      const veryLongText = 'A'.repeat(10000);

      expect(() => {
        analyzer.analyzeArticle(veryLongText);
      }).not.toThrow();
    });
  });
});
