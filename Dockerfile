# 使用 Node.js 官方镜像作为基础镜像
FROM node:20-slim

# 安装 Python 和 pip
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# 创建虚拟环境
RUN python3 -m venv /venv

# 激活虚拟环境并安装 edge-tts
RUN /venv/bin/pip install edge-tts


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
EXPOSE 3001

# # 添加健康检查
# HEALTHCHECK --interval=30s --timeout=3s \
#   CMD curl -f http://localhost:5173/ || exit 1

# 启动tts服务
# CMD ["node", "start-tts-server.mjs"]

# 启动应用
CMD ["npm", "run", "serve"]