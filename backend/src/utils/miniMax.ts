import https from "https";
import config from "../config";

export interface MiniMaxTextRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature: number;
}

export async function callMiniMaxText(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const { apiKey, baseUrl, model } = config.miniMax;

  const requestData = JSON.stringify({
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    temperature: 0.3,
  });

  const options: https.RequestOptions = {
    hostname: new URL(baseUrl).hostname,
    path: "/v1/text/chatcompletion_v2",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Length": Buffer.byteLength(requestData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let result = "";
      res.on("data", (chunk) => {
        result += chunk;
      });
      res.on("end", () => {
        resolve(result);
      });
    });
    req.on("error", reject);
    req.write(requestData);
    req.end();
  });
}
