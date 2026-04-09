import { AuthRequest } from "../middleware/auth";

export interface MulterRequest extends AuthRequest {
  file?: Express.Multer.File;
}
