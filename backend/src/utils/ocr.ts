import FormData from "form-data";
import fs from "fs";
import http from "http";
import https from "https";
import { URL } from "url";
import config from "../config";
import logger from "./logger";

export interface OCRText {
  text: string;
  confidence: number;
  bbox: number[][];
}

export interface OCRResult {
  texts: OCRText[];
  full_text: string;
  elapsed_ms: number;
}

export interface OCRResponse {
  success: boolean;
  data?: OCRResult;
}

export async function callOCRService(imagePath: string): Promise<string> {
  const { baseUrl } = config.ocr;
  const TIMEOUT_MS = 30000; // 30秒超时

  if (!fs.existsSync(imagePath)) {
    throw new Error(`图片文件不存在: ${imagePath}`);
  }

  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(imagePath));
    formData.append("language", "ch");

    const urlObj = new URL(`${baseUrl}/api/v1/ocr/recognize`);
    const protocol = urlObj.protocol === "https:" ? https : http;

    // 处理端口：如果URL中没有明确指定端口，使用协议的默认端口
    let port: number | undefined;
    if (urlObj.port) {
      port = parseInt(urlObj.port, 10);
    } else {
      port = urlObj.protocol === "https:" ? 443 : 80;
    }

    logger.info(
      `OCR请求配置: protocol=${urlObj.protocol}, hostname=${urlObj.hostname}, port=${port}, path=${urlObj.pathname}`,
    );

    const result = await Promise.race([
      new Promise<OCRResponse>((resolve, reject) => {
        const options = {
          hostname: urlObj.hostname,
          port: port,
          path: urlObj.pathname + urlObj.search,
          method: "POST",
          headers: formData.getHeaders(),
          timeout: TIMEOUT_MS,
        };

        const req = protocol.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            logger.info(
              `OCR响应状态码: ${res.statusCode}，内容长度: ${data.length}`,
            );

            if (res.statusCode !== 200) {
              reject(
                new Error(
                  `OCR服务错误: ${res.statusCode} ${res.statusMessage}`,
                ),
              );
              return;
            }

            try {
              const parsed = JSON.parse(data) as OCRResponse;
              resolve(parsed);
            } catch (e) {
              reject(new Error(`解析OCR响应失败: ${(e as Error).message}`));
            }
          });
        });

        req.on("error", (error) => {
          reject(new Error(`OCR服务连接失败: ${error.message}`));
        });

        req.on("timeout", () => {
          req.destroy();
          reject(new Error(`OCR服务请求超时 (${TIMEOUT_MS}ms)`));
        });

        formData.pipe(req);
      }),
      new Promise<OCRResponse>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `OCR服务超时: 未在 ${TIMEOUT_MS}ms 内返回响应，请检查 OCR 服务 (${baseUrl}) 是否运行`,
              ),
            ),
          TIMEOUT_MS,
        ),
      ),
    ]);

    if (!result.success || !result.data) {
      throw new Error("OCR识别失败");
    }

    logger.info(
      `OCR识别成功，耗时: ${result.data.elapsed_ms}ms，识别文本长度: ${result.data.full_text.length}`,
    );

    return result.data.full_text;
  } catch (error) {
    logger.error(`OCR服务调用失败: ${(error as Error).message}`);
    throw error;
  }
}
