# Blog Admin

一个独立部署在 Cloudflare Pages 上的后台应用，用来管理 Hugo 博客内容。

## 已实现范围

- Cloudflare Access 头鉴权中间件
- GitHub Contents API 封装
- Hugo Front Matter 解析与序列化
- 文章列表、创建、编辑、删除 API
- 图片上传到 R2
- React 管理端列表页与编辑页
- 编辑页本地自动保存草稿
- Markdown 预览
- 单元测试、集成测试、端到端测试

## 本地运行

1. 安装依赖：

```bash
pnpm install
```

2. 复制环境变量示例：

```bash
cp .dev.vars.example .dev.vars
```

本地联调时还需要设置：

- `DEV_ACCESS_EMAIL`

它只在 `localhost` / `127.0.0.1` 的开发请求里生效，用来模拟 Cloudflare Access 注入的邮箱头。通常把它设成和 `ALLOWED_EMAILS` 相同的邮箱即可。

3. 启动前端开发：

```bash
pnpm dev
```

4. 如果要带上 Cloudflare Pages Functions 和 R2 绑定做本地联调，先构建一次：

```bash
pnpm build
pnpm dev:pages
```

如果你在频繁改前端，建议开两个终端：

```bash
# 终端 1
pnpm build:watch

# 终端 2
pnpm dev:pages
```

5. 运行单元与集成测试：

```bash
pnpm test
```

6. 运行端到端测试：

```bash
pnpm test:e2e
```

## Cloudflare 部署

1. 创建一个新的 Cloudflare Pages 项目，用这个 `blog-admin` 仓库作为源代码。
2. 在 Pages 项目中绑定 R2 Bucket，绑定名保持为 `MEDIA_BUCKET`。
3. 在 Pages 项目环境变量里设置：
   - `GITHUB_TOKEN`
   - `ALLOWED_EMAILS`
   - `GITHUB_OWNER`
   - `GITHUB_REPO`
   - `GITHUB_BRANCH`
   - `POSTS_DIR`
   - `R2_PUBLIC_BASE_URL`
4. 给后台域名接入 Cloudflare Access，只允许你的邮箱访问。
5. 为 R2 配置一个可公开访问的自定义域名，例如 `cdn.example.com`。
6. 把后台站点发布到类似 `admin.example.com` 的子域名。

## GitHub 凭据建议

- MVP 阶段可以用 fine-grained PAT，只授予目标仓库 `Contents: Read and write`。
- 长期建议切换到 GitHub App，降低个人 Token 绑定风险。

## 当前约束

- 当前默认文章路径为 `content/posts/<slug>.md`。
- 草稿直接使用 Hugo 的 `draft` 字段。
- D1、定时发布、操作日志和多人协作还未实现。
