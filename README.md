# Mora - 极简优雅的莫兰迪低饱和度个人导航系统

Mora 是一款致力于提供温润、静谧与高效率使用体验的个人自托管导航站系统。项目采用 **Astro 框架** 作为核心，融入了极现代的毛玻璃拟态（Glassmorphism）与低饱和度莫兰迪配色系统。

通过**本地离线沙盒**（localStorage + IndexedDB）与**云端数据库**（Supabase）的无缝双轨结合，Mora 不仅能在无服务器环境下完美运行，配置 Supabase 后更能开启数据多端同步、物理资产云端保存以及管理员权限管理功能。

---

## ✨ 核心特性

* ☕ **莫兰迪美学视觉**：精心调配的低饱和度配色，支持流光渐变、暖米纯色、静谧深空暗调、在线/本地高清壁纸等多种风格，支持卡片透明度、模糊度的无级滑块调节。
* ⚡ **首屏防闪烁设计**：首屏渲染通过 HTML 顶部的 inline 高速解析脚本完成，对背景、字体 Class 和 CSS 自定义变量进行无感对齐，消灭任何渲染闪烁或内容抖动。
* 🔄 **双轨离线/在线同步**：
  * **未配置云端**：全功能本地离线运行，使用 localStorage 存储数据，使用 IndexedDB 缓存壁纸与字体文件。
  * **配置云端**：登录后数据静默上云。当多端数据发生冲突时，提供“双向合并去重（推荐）”、“覆盖云端”、“覆盖本地”三种智能同步策略。
* 📝 **智能网址识别贴入**：在搜索栏中一旦粘贴 URL 链接，系统将自动弹出添加卡片气泡。点击“添加”即可自动解析并带入域名缩写标题，实现无感录入。
* 🎨 **高保真自定义表单引擎**：
  * **自定义 Select 选择器**：内置了支持色彩小圆点、图标选择、防表格裁剪向上弹起、以及可直接在选择框中“搜索或新建分类”的高保真下拉菜单。
  * **Lucide 图标选择器**：带有分类模糊搜索与高保真网格视图的图标拾取组件，具备 Lucide 动态渲染及安全轮询兜底。
* 🌦️ **治愈系侧栏挂件**：
  * 精确到秒的实时时钟与星期挂件。
  * **诗意天气气象站**：包含舒适微风、多云转晴、和风细雨、晴空朗朗等多种动态天气及治愈诗词，支持点击手动变幻天气，增添生活温度。
* 🖐️ **长按振动拖动排序**：在后台管理面板中，支持长按或长触摸触发分类的物理抖动，开启垂直拖拽对分类重新排序，并在松开后自动进行云端与本地同步。
* 🛡️ **细粒度权限管理**：集成 profiles 会员画像表，支持 `admin` 角色在后台对所有注册用户的身份角色及物理文件上传权限进行细粒度开关与修改。
* 💾 **备份与恢复**：支持一键导出完整导航数据（包含分类、卡片和外观配置）为 JSON 格式；支持导入 JSON 还原；支持重置为最初的出厂种子数据。

---

## 🚀 快速开始

### 1. 环境准备
确保您的本地环境已安装 Node.js（建议版本 `>= 22.12.0`）或 Bun 包管理工具。

### 2. 克隆与安装依赖
```sh
# 安装依赖
bun install
# 或者使用 npm
npm install
```

### 3. 配置 Supabase 云服务 (可选)
如果您需要开启云端多端同步、多用户系统与物理上传功能：
1. 前往 [Supabase 官网](https://supabase.com) 创建一个新的 Project。
2. 进入项目的 **SQL Editor**，复制并粘贴本项目根目录下的 [init-supabase.sql](file:///e:/project/dock/init-supabase.sql) 初始脚本并执行，完成表结构、RLS 行级安全策略、存储桶与字段索引的建立。
3. 在 Supabase 控制台的 **Storage** 中，确保存在一个名为 `mora-assets` 的存储桶，并为之绑定公网访问属性。
4. 在项目根目录下创建 `.env` 配置文件，并填入您的 Supabase 凭证：
   ```env
   PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key
   ```
   > 💡 如果不需要云服务，可以直接删除 `.env` 或留空，系统将自动退回到纯本地离线沙盒模式，所有数据和设置完全存储于您当前的浏览器中。

### 4. 启动开发服务器
```sh
bun run dev
# 或者
npm run dev
```
启动后，可在浏览器中访问 `http://localhost:4321` 查看您的导航站。

### 5. 生产打包与预览
```sh
# 打包构建生产包
bun run build
# 本地预览打包后的生产包
bun run preview
```

---

## 📂 项目结构

```text
/
├── public/                  # 静态资源，如网站默认 favicon 等
├── src/
│   ├── assets/              # SVG 静态图标资源
│   ├── components/          # 封装的 Astro 视觉组件 (SearchBar, Sidebar 等)
│   ├── layouts/             # 全局 Layout 页面骨架 (包含 CSS 变量、毛玻璃效果、首屏防闪烁脚本)
│   ├── pages/               # 主页面定义 (首页 index、管理页 admin、设置中心 settings)
│   ├── scripts/             # 核心 JavaScript/TypeScript 控制逻辑
│   │   ├── admin/           # 后台控制器的业务逻辑
│   │   ├── components/      # 组件交互脚本 (如侧边栏时钟、天气模拟)
│   │   ├── services/        # 数据库与远程数据交互层
│   │   ├── storage/         # 双轨同步核心层 (localStorage 及 IndexedDB 沙盒)
│   │   ├── ui/              # 全局 UI 挂件封装 (Toast 机制、自定义下拉 Select、图标拾取器)
│   │   └── utils/           # 工具函数 (网址正则提取、推荐标题生成等)
│   └── styles/              # 后台管理及个性化面板的专属样式 CSS
├── init-supabase.sql        # Supabase 数据库表、行级安全(RLS)策略及索引定义
├── astro.config.mjs         # Astro 框架基础配置文件
├── package.json             # 依赖声明与运行脚本定义
└── tsconfig.json            # TypeScript 编译器规则配置文件
```

---

## 🛡️ 安全审计说明
本项目已开启了 Supabase 行级安全（RLS）保护策略：
* **公开读取**：匿名访客只能读取主页展示的 categories 与 links，以及对应的 appearance 配置，保障导航主页可被公开访问。
* **写保护**：对于 `categories`、`links` 与 `appearance` 表的 `INSERT` / `UPDATE` / `DELETE` 操作，仅允许已通过邮箱登录的记录所有者（即 `auth.uid() = user_id`）操作。
* **资产隔离**：`storage.objects` 中，用户上传的物理资源在 `mora-assets` 桶内使用 `auth.uid()` 子目录彻底隔离，非资产所有者无法修改和覆盖。

---

## 📄 开源协议
本项目遵循 MIT 协议开源。
