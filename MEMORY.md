# Teaching Assistant System - Implementation Notes

## Current Architecture (2026-04-07)

### Project Structure

- **Backend**: Node.js/Express/TypeScript with Sequelize ORM
- **Frontend**: React/TypeScript with Vite
- **OCR Service**: Python/FastAPI with PaddleOCR (或 Mock 服务用于测试)
- **Database**: MySQL

## Recent Changes: OCR + LLM Pipeline Implementation

### 核心改造
从直接大模型视觉识别改为 **OCR + LLM 两步流程**：

```
Image Upload
    ↓
OCR Recognition (http://127.0.0.1:9000/api/v1/ocr/recognize)
    ↓ [获取识别的文本]
LLM Processing (MiniMax API)
    ↓ [提取题目和答案]
Auto-Grading & Grade Assignment
```

### Files Modified/Created

#### Backend 配置 & Utils
- **backend/src/config.ts**
  - Added: `ocr.baseUrl = "http://127.0.0.1:9000"`
  - 使用 127.0.0.1 明确指定 IPv4 (避免 IPv6 localhost 问题)

- **backend/src/utils/ocr.ts** ✨ NEW
  - `callOCRService(imagePath: string): Promise<string>`
  - 使用 Node.js 原生 `http/https` 模块 (不依赖 fetch)
  - 支持 multipart form-data 上传
  - 返回 OCR 识别的完整文本

- **backend/src/utils/miniMax.ts** ♻️ REFACTORED
  - Old: `callMiniMaxVision(prompt, imageBase64)` → ❌ REMOVED
  - New: `callMiniMaxText(systemPrompt, userMessage)` → ✅ ACTIVE
  - 改为处理文本而非图片 Base64

#### 控制器更新
- **backend/src/controllers/submissionController.ts**
  - 第 129-203 行: 实现 OCR + LLM 流程
  - Step 1: OCR 识别 → 获取文本
  - Step 2: LLM 处理 → 提取答案
  - Step 3: 自动批改 → 生成成绩

- **backend/src/controllers/homeworkController.ts**
  - `recognizeHomework()` 函数 (第 320-426 行)
  - 实现相同的 OCR + LLM 流程

#### 依赖更新
- **backend/package.json**
  - Added: `form-data@^4.0.0` - 多部分表单上传
  - Added: `sharp@^0.x.x` - 图片压缩处理

### Bug Fixes & Issues Resolved

#### 1. ✅ OCR 服务连接失败
**问题**: `fetch failed` - Node.js 中 fetch API 不稳定
**解决**: 使用 Node.js 原生 `http/https` 模块 with proper stream handling

#### 2. ✅ IPv6 localhost 问题
**问题**: `connect ECONNREFUSED ::1:8000` - localhost 被解析为 IPv6
**解决**: 明确使用 `127.0.0.1` 替代 `localhost`

#### 3. ✅ OCR 服务模型加载失败 (Windows)
**问题**: PaddleOCR 在 Windows 缺少 torch DLL 依赖
**临时解决**: 使用 Mock OCR 服务在端口 9000 用于开发/测试

#### 4. ✅ OCR 服务端口被占用
**问题**: 原 OCR 服务占用 8000 端口且无法绕过
**解决**: Mock 服务改用 9000 端口

#### 5. ✅ OCRService 代码 bug
**问题**: `events.py` 调用不存在的 `paddle_ocr_service.load_model()`
**解决**: 修改为直接导入模块级函数

### Mock OCR Service (用于测试)

**端口**: 9000
**端点**: `POST http://127.0.0.1:9000/api/v1/ocr/recognize`

**响应格式**:
```json
{
  "success": true,
  "data": {
    "texts": [
      {
        "text": "识别的文本",
        "confidence": 0.95,
        "bbox": [[10, 10], [200, 10], [200, 30], [10, 30]]
      }
    ],
    "full_text": "完整识别文本",
    "elapsed_ms": 150.5
  }
}
```

### Build & Deployment Status

✅ **TypeScript Compilation**: 成功
✅ **Dependencies Installed**: 包括 form-data 和 sharp
✅ **Config Updated**: OCR 端点指向 127.0.0.1:9000
✅ **Mock OCR Service**: 可在后台启动用于测试
✅ **Backend Ready**: 已编译完成可启动

### Startup Instructions

#### 1. 启动 Mock OCR 服务 (用于测试)
```bash
cd d:/test/teaching_assistant
python -c "
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if '/ocr/recognize' in self.path:
            response = {'success': True, 'data': {'texts': [], 'full_text': '测试文本', 'elapsed_ms': 100}}
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{\"status\":\"ok\"}')
    def log_message(self, *args): pass

HTTPServer(('127.0.0.1', 9000), Handler).serve_forever()
" &
```

#### 2. 启动 Backend
```bash
cd backend
npm start
```

#### 3. 验证系统
```bash
# 测试 OCR 服务
curl http://127.0.0.1:9000/

# 测试 Backend (需要数据库)
curl http://127.0.0.1:3000/login
```

### Key Technical Details

**OCR 客户端实现** (`ocr.ts`):
- 使用 `URL` 类解析 OCR 服务地址
- 自动选择 `http` 或 `https` 协议
- FormData 通过流式 pipe 传输 (支持大文件)
- 完整的 JSON 响应解析和错误处理

**LLM 调用** (`miniMax.ts`):
- System prompt: 定义 AI 角色
- User message: 包含题目、标准答案和 OCR 文本
- 返回 JSON 数组格式答案供 auto-grading 使用

**Auto-Grading Logic** (`submissionController.ts`):
- 逐题对比学生答案和标准答案 (exact match)
- 计算正确率转换为百分制
- 生成反馈信息存储到 Grade 表

### Next Steps (如需要)

1. **生产环境 OCR**:
   - 部署完整的 PaddleOCR FastAPI 服务
   - 或集成商业 OCR API (如阿里云、百度、腾讯)

2. **性能优化**:
   - 异步处理 OCR + LLM 调用
   - 实现结果缓存
   - 批量处理提交

3. **测试**:
   - 创建单元测试覆盖 OCR/LLM 流程
   - 集成测试验证端到端流程

### Configuration Environment Variables

```bash
# OCR Service
OCR_BASE_URL=http://127.0.0.1:9000

# MiniMax API
MINIMAX_API_KEY=sk-...
MINIMAX_BASE_URL=https://api.minimaxi.com
MINIMAX_MODEL=MiniMax-M2.7

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=teaching_assistant

# Server
JWT_SECRET=teaching-assistant-secret-key
```
