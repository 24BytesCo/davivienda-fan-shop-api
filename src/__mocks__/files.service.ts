import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  async uploadFiles(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) return [];
    return files.map((_, idx) => `https://mock.storage/${idx}.png`);
  }

  async deleteFiles(urls: string[]): Promise<void> {
    // noop in mock
  }
}

