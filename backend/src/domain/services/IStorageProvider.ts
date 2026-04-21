export interface IStorageProvider {
  upload(file: Express.Multer.File): Promise<string>;
}
