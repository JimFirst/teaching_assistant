"""Simple mock OCR service for testing."""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import cgi
import time
import threading


class MockOCRHandler(BaseHTTPRequestHandler):
    """Mock OCR API handler."""

    def do_POST(self):
        if self.path == "/api/v1/ocr/recognize":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            # Parse multipart form data
            content_type = self.headers.get("Content-Type", "")
            if "multipart/form-data" in content_type:
                # Simple mock response - just return sample text
                response = {
                    "success": True,
                    "data": {
                        "texts": [
                            {
                                "text": "第一题：这是一道测试题",
                                "confidence": 0.95,
                                "bbox": [[10, 10], [200, 10], [200, 30], [10, 30]],
                            },
                            {
                                "text": "答案：测试答案",
                                "confidence": 0.92,
                                "bbox": [[10, 40], [200, 40], [200, 60], [10, 60]],
                            },
                        ],
                        "full_text": "第一题：这是一道测试题\n答案：测试答案",
                        "elapsed_ms": 150.5,
                    },
                    "request_id": "mock-123",
                }

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_response(400)
                self.end_headers()
        elif self.path == "/api/v1/health":
            response = {"status": "healthy", "model_ready": True, "version": "1.0.0"}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        """Suppress HTTP request logs."""
        pass


def run_mock_ocr_server(host="127.0.0.1", port=8000):
    """Run mock OCR server."""
    server = HTTPServer((host, port), MockOCRHandler)
    print(f"Mock OCR Service running on {host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run_mock_ocr_server()
