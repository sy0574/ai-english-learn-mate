# 英语学习系统部署指南

## 环境要求
- Node.js 版本: 16.0.0 或更高
- npm 版本: 8.0.0 或更高
- 现代浏览器（Chrome、Firefox、Safari、Edge 等）

## 必需的API密钥
在开始部署之前，请确保您有以下API密钥：
1. OpenRouter API密钥 - 用于连接AI模型
2. Step API密钥 - 用于特定的AI分析任务
3. Supabase配置 - 用于数据存储

## 部署步骤

### 1. 下载代码
```bash
# 克隆代码仓库（如果是从Git下载）
git clone [仓库地址]

# 进入项目目录
cd project-els-v20241121-04
```

### 2. 安装依赖
```bash
# 安装项目依赖
npm install
```

### 3. 配置环境变量
1. 在项目根目录找到 `.env.example` 文件
2. 复制该文件并重命名为 `.env`
3. 编辑 `.env` 文件，填入您的API密钥：
```bash
VITE_OPENROUTER_API_KEY=您的OpenRouter密钥
VITE_OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
VITE_SUPABASE_URL=您的Supabase URL
VITE_SUPABASE_ANON_KEY=您的Supabase匿名密钥
VITE_STEP_API_KEY=您的Step API密钥
VITE_STEP_API_URL=https://api.stepfun.com/v1/chat/completions
```

### 4. 启动开发服务器
```bash
# 启动开发服务器
npm run dev
```
启动后，在浏览器中访问：http://localhost:5173

### 5. 构建生产版本
```bash
# 构建生产版本
npm run build
```
构建完成后，生产文件会在 `dist` 目录中。

## 常见问题解决

### 1. API连接问题
如果看到"API认证失败"错误：
- 检查 `.env` 文件中的API密钥是否正确填写
- 确认API密钥没有过期
- 检查API使用额度是否充足

### 2. 依赖安装问题
如果 `npm install` 失败：
- 尝试删除 `node_modules` 文件夹和 `package-lock.json` 文件
- 重新运行 `npm install`
- 如果还是失败，可以尝试使用 `npm install --legacy-peer-deps`

### 3. 启动失败
如果项目无法启动：
- 检查Node.js版本是否符合要求
- 确认所有环境变量都已正确配置
- 查看控制台错误信息，对照本文档的常见问题解决

## 部署检查清单
- [ ] Node.js和npm版本符合要求
- [ ] 所有依赖安装成功
- [ ] 环境变量配置正确
- [ ] API密钥可用且有效
- [ ] 开发服务器能正常启动
- [ ] 生产版本能成功构建

## 获取帮助
如果遇到本文档未覆盖的问题：
1. 检查浏览器控制台的错误信息
2. 查看项目中的错误提示
3. 联系技术支持

## 维护建议
1. 定期检查API密钥的有效性和使用额度
2. 保存一份环境变量的备份
3. 在修改代码前先备份 `dist` 目录

## 安全提醒
- 永远不要将 `.env` 文件提交到代码仓库
- 定期更换API密钥
- 在生产环境中使用HTTPS

01