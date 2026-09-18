import {
  Controller, Post, Get, Delete, Param, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException, Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
const allowedFolders = new Set(['products', 'categories', 'settings']);

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const getFolderName = (folder?: string) => {
  const normalized = String(folder || '').trim().toLowerCase();
  return allowedFolders.has(normalized) ? normalized : '';
};

const ensureDir = (folder?: string) => {
  const normalized = getFolderName(folder);
  const targetDir = normalized ? join(uploadDir, normalized) : uploadDir;
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
  return { normalized, targetDir };
};

const storage = diskStorage({
  destination: (req, _file, cb) => {
    const { targetDir } = ensureDir(req.query?.folder as string);
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const name = uuid() + extname(file.originalname).toLowerCase();
    cb(null, name);
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new BadRequestException('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
  }
  cb(null, true);
};

@Controller('upload')
export class UploadController {
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage, fileFilter, limits: { fileSize: MAX_SIZE } }))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Query('folder') folder?: string) {
    if (!file) throw new BadRequestException('No file uploaded');
    const normalized = getFolderName(folder);
    const prefix = normalized ? `${normalized}/` : '';
    return { url: `/uploads/${prefix}${file.filename}`, filename: file.filename };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, { storage, fileFilter, limits: { fileSize: MAX_SIZE } }))
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[], @Query('folder') folder?: string) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    const normalized = getFolderName(folder);
    const prefix = normalized ? `${normalized}/` : '';
    return files.map((f) => ({ url: `/uploads/${prefix}${f.filename}`, filename: f.filename }));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('list')
  listFiles(@Query('folder') folder?: string) {
    const results: Array<{ url: string; filename: string; folder: string; size: number; modified: string }> = [];
    const scanFolder = (folderName: string) => {
      const dir = folderName ? join(uploadDir, folderName) : uploadDir;
      if (!existsSync(dir)) return;
      const files = readdirSync(dir);
      for (const file of files) {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) continue;
        const ext = extname(file).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) continue;
        const prefix = folderName ? `${folderName}/` : '';
        results.push({
          url: `/uploads/${prefix}${file}`,
          filename: file,
          folder: folderName || 'root',
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
      }
    };
    if (folder && allowedFolders.has(folder)) {
      scanFolder(folder);
    } else {
      scanFolder('');
      for (const f of allowedFolders) scanFolder(f);
    }
    results.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    return results;
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':folder/:filename')
  deleteFile(@Param('folder') folder: string, @Param('filename') filename: string) {
    if (!allowedFolders.has(folder)) throw new BadRequestException('Invalid folder');
    if (filename.includes('..') || filename.includes('/')) throw new BadRequestException('Invalid filename');
    const filePath = join(uploadDir, folder, filename);
    if (!existsSync(filePath)) throw new BadRequestException('File not found');
    unlinkSync(filePath);
    return { message: 'File deleted' };
  }
}
