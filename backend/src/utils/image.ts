import sharp from "sharp";
import path from "path";
import fs from "fs";
import { MulterRequest } from "./types";

export async function compressImage(
  imagePath: string,
  maxWidth: number = 1024,
  quality: number = 80
): Promise<string> {
  const buffer = await sharp(imagePath)
    .resize(maxWidth, null, {
      withoutEnlargement: true,
    })
    .jpeg({ quality })
    .toBuffer();

  return buffer.toString("base64");
}

export function getImageBase64(multerReq: MulterRequest): string | null {
  if (!multerReq.file) {
    return null;
  }

  const imagePath = path.join(
    __dirname,
    "../../uploads",
    multerReq.file.filename
  );

  if (!fs.existsSync(imagePath)) {
    return null;
  }

  return fs.readFileSync(imagePath, { encoding: "base64" });
}

export async function getCompressedImageBase64(
  multerRequest: MulterRequest,
  maxWidth: number = 1024
): Promise<string | null> {
  if (!multerRequest.file) {
    return null;
  }

  const imagePath = path.join(
    __dirname,
    "../../uploads",
    multerRequest.file.filename
  );

  if (!fs.existsSync(imagePath)) {
    return null;
  }

  return compressImage(imagePath, maxWidth);
}
