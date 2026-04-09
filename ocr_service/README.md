# PaddleOCR FastAPI Service

基于 PaddleOCR 的高性能 FastAPI OCR 识别服务。

## 特性

- **模型预热**: 应用启动时自动预热模型，消除首次请求延迟
- **异步处理**: 支持异步 OCR 调用，提升并发性能
- **错误处理**: 完善的异常处理机制，清晰的错误分类
- **性能监控**: Prometheus 指标监控，结构化日志
- **健康检查**: Kubernetes 就绪/存活探针支持

## 快速开始

### 使用 Docker Compose (推荐)

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f ocr_service

# 停止服务
docker-compose down
```

### 本地开发

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 运行服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API 文档

启动服务后访问:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 端点

### 健康检查

```bash
# 健康检查 (含模型状态)
curl http://localhost:8000/api/v1/health

# 就绪检查
curl http://localhost:8000/api/v1/health/ready
```

### OCR 识别

```bash
# 单图像识别
curl -X POST "http://localhost:8000/api/v1/ocr/recognize" \
  -F "file=@test.jpg" \
  -F "language=ch"

# 指定检测方向
curl -X POST "http://localhost:8000/api/v1/ocr/recognize" \
  -F "file=@test.jpg" \
  -F "language=en" \
  -F "detect_direction=true"

# 批量识别
curl -X POST "http://localhost:8000/api/v1/ocr/recognize/batch" \
  -F "files=@test1.jpg" \
  -F "files=@test2.jpg"
```

### 性能指标

```bash
# Prometheus 指标
curl http://localhost:8000/metrics
```

## 配置

| 环境变量 | 默认值 | 描述 |
|---------|--------|------|
| `HOST` | `0.0.0.0` | 服务监听地址 |
| `PORT` | `8000` | 服务监听端口 |
| `DEBUG` | `false` | 调试模式 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `MAX_FILE_SIZE` | `10485760` | 最大文件大小 (10MB) |
| `OCR_USE_GPU` | `true` | 是否使用 GPU |
| `OCR_USE_ANGLE_CLS` | `true` | 是否使用方向分类 |
| `OCR_LANG` | `ch` | 默认语言 |

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    "texts": [
      {
        "text": "识别的文本",
        "confidence": 0.98,
        "bbox": [[0, 0], [100, 0], [100, 20], [0, 20]]
      }
    ],
    "full_text": "识别的文本",
    "elapsed_ms": 150.5
  },
  "request_id": "uuid"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "IMAGE_PROCESS_ERROR",
    "message": "图像处理失败",
    "details": null
  },
  "request_id": "uuid"
}
```

## 性能测试

```bash
# 使用 ab 进行并发测试
ab -n 100 -c 10 -p test.jpg -T "multipart/form-data" http://localhost:8000/api/v1/ocr/recognize
```

## 目录结构

```
ocr_service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # 配置管理
│   ├── api/v1/               # API 路由
│   ├── core/                 # 核心功能
│   │   ├── events.py         # 启动/关闭事件
│   │   └── middleware.py      # 中间件
│   ├── services/             # 业务逻辑
│   │   └── paddle_ocr.py     # PaddleOCR 服务
│   ├── schemas/               # Pydantic 模型
│   └── utils/                 # 工具函数
├── tests/                     # 测试
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## License

MIT
