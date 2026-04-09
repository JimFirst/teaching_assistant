#!/bin/bash
# 启动 Teaching Assistant Backend

cd d:/test/teaching_assistant/backend

# 检查编译状态
if [ ! -f "dist/index.js" ]; then
  echo "Backend 未编译，正在编译..."
  npm run build
fi

# 启动 Backend
echo "启动 Backend (端口 3001)..."
PORT=3001 node dist/index.js
