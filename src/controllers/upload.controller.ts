import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

const allowed: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dataUrl = String(req.body.dataUrl ?? '');
    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) throw ApiError.badRequest('Invalid image data');
    const mime = match[1];
    const extension = allowed[mime];
    if (!extension) throw ApiError.badRequest('Unsupported image format');
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > 2 * 1024 * 1024) throw ApiError.badRequest('Image must be smaller than 2 MB');

    const directory = path.resolve(process.cwd(), 'uploads', 'word-sets');
    await mkdir(directory, { recursive: true });
    const filename = `${req.user!.userId}-${randomUUID()}.${extension}`;
    await writeFile(path.join(directory, filename), buffer, { flag: 'wx' });
    const url = `${req.protocol}://${req.get('host')}/uploads/word-sets/${filename}`;
    ApiResponse.created(res, { url, mime, size: buffer.length }, 'Image uploaded');
  } catch (error) {
    next(error);
  }
};
