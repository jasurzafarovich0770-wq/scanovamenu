import { IStorageProvider } from './IStorageProvider';

export class UploadService {
  constructor(private readonly storageProvider: IStorageProvider) {}

  upload(file: Express.Multer.File): Promise<string> {
    return this.storageProvider.upload(file);
  }
}
