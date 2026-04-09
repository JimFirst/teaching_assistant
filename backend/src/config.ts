export default {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "teaching_assistant",
  jwtSecret: process.env.JWT_SECRET || "teaching-assistant-secret-key",
  ocr: {
    baseUrl: process.env.OCR_BASE_URL || "http://localhost:8000",
  },
  miniMax: {
    apiKey:
      process.env.MINIMAX_API_KEY ||
      "sk-cp-3hieik75aT4HlHPcVpCcP1CsVEUNClkFROqHTW38MQM-LghRwW4Jthje9TahKxCeB2IjfMlVOgKAzVqYmXCFkNt_0C12_RU0TjDHUhztdvvMnyzQANuJ2uI",
    baseUrl: process.env.MINIMAX_BASE_URL || "https://api.minimaxi.com",
    model: process.env.MINIMAX_MODEL || "MiniMax-M2.7",
  },
};
