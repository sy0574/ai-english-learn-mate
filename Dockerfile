# 使用 Node.js 官方镜像作为基础镜像
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 5173

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:5173/ || exit 1

# 启动应用
CMD ["npm", "run", "serve"]