import type { AppearanceConfig, Category, Link, SiteConfig } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: '开发极客', icon: 'code-xml', color: 'blue', order: 1 },
  { id: 'cat-2', name: '设计创意', icon: 'palette', color: 'pink', order: 2 },
  { id: 'cat-3', name: '产品运营', icon: 'presentation', color: 'purple', order: 3 },
  { id: 'cat-4', name: 'AI 前沿', icon: 'sparkles', color: 'green', order: 4 }
];

export const DEFAULT_LINKS: Link[] = [
  /* 开发极客 */
  { id: 'link-1', categoryId: 'cat-1', title: 'GitHub', url: 'https://github.com', description: '全球最大的开源代码托管与技术协作平台。', icon: 'github', clicks: 0, order: 1 },
  { id: 'link-2', categoryId: 'cat-1', title: 'Stack Overflow', url: 'https://stackoverflow.com', description: '全球开发者的技术问答与知识共享社区。', icon: 'message-square-more', clicks: 0, order: 2 },
  { id: 'link-3', categoryId: 'cat-1', title: 'V2EX', url: 'https://v2ex.com', description: '高品质的创意、技术、极客工作与生活交流社区。', icon: 'globe', clicks: 0, order: 3 },
  { id: 'link-4', categoryId: 'cat-1', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: '最权威、详尽的 Web 前端开发技术参考文档。', icon: 'file-text', clicks: 0, order: 4 },

  /* 设计创意 */
  { id: 'link-5', categoryId: 'cat-2', title: 'Figma', url: 'https://www.figma.com', description: '新一代跨平台实时协作的 UI/UX 界面设计工具。', icon: 'framer', clicks: 0, order: 1 },
  { id: 'link-6', categoryId: 'cat-2', title: 'Dribbble', url: 'https://dribbble.com', description: '全球最顶尖设计师分享灵感与视觉创意的殿堂。', icon: 'palette', clicks: 0, order: 2 },
  { id: 'link-7', categoryId: 'cat-2', title: 'Behance', url: 'https://www.behance.net', description: 'Adobe 旗下的全球创意设计师作品集展示平台。', icon: 'compass', clicks: 0, order: 3 },
  { id: 'link-8', categoryId: 'cat-2', title: 'Iconfont', url: 'https://www.iconfont.cn', description: '阿里巴巴矢量图标库，提供海量图标资源下载与管理。', icon: 'image', clicks: 0, order: 4 },

  /* 产品运营 */
  { id: 'link-9', categoryId: 'cat-3', title: 'Notion', url: 'https://notion.so', description: '集文档、项目管理、知识库于一身的超级全能工作台。', icon: 'notebook-tabs', clicks: 0, order: 1 },
  { id: 'link-10', categoryId: 'cat-3', title: 'ProcessOn', url: 'https://www.processon.com', description: '高效易用的在线思维导图、流程图与图表作图工具。', icon: 'git-fork', clicks: 0, order: 2 },
  { id: 'link-11', categoryId: 'cat-3', title: '墨刀', url: 'https://modao.cc', description: '极速原型设计与协同平台，产品经理必备画图利器。', icon: 'layers', clicks: 0, order: 3 },
  { id: 'link-12', categoryId: 'cat-3', title: '少数派', url: 'https://sspai.com', description: '高品质内容平台，致力于用数字工具提升日常效率。', icon: 'compass', clicks: 0, order: 4 },

  /* AI 前沿 */
  { id: 'link-13', categoryId: 'cat-4', title: 'ChatGPT', url: 'https://chatgpt.com', description: 'OpenAI 出品，全球最强大、最通用的智能语言对话助手。', icon: 'sparkles', clicks: 0, order: 1 },
  { id: 'link-14', categoryId: 'cat-4', title: 'Claude', url: 'https://claude.ai', description: 'Anthropic 开发，代码及逻辑推理能力极佳的顶级模型。', icon: 'bot', clicks: 0, order: 2 },
  { id: 'link-15', categoryId: 'cat-4', title: 'Midjourney', url: 'https://www.midjourney.com', description: '全球首屈一指的 AI 艺术图像生成与画画创意社区。', icon: 'wand', clicks: 0, order: 3 },
  { id: 'link-16', categoryId: 'cat-4', title: 'Hugging Face', url: 'https://huggingface.co', description: 'AI 与深度学习大模型社区，开源模型的黄金圣地。', icon: 'cpu', clicks: 0, order: 4 }
];

export const KEY_CATEGORIES = 'nav_categories';
export const KEY_LINKS = 'nav_links';
export const KEY_APPEARANCE = 'nav_appearance';

export const DEFAULT_APPEARANCE: AppearanceConfig = {
  bgStyle: 'morandi-glow',
  customBgUrl: '',
  cardOpacity: 0.65,
  cardBlur: 20,
  primaryColor: 'blue',
  fontStyle: 'morandi-sans',
  fontCustomLink: '',
  fontFamilyName: '',
  scrollbarEnabled: false,
  githubUsername: ''
};

export const KEY_SITE_CONFIG = 'nav_site_config';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  allowRegistration: false
};
