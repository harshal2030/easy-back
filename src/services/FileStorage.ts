import fs from 'fs';
import sharp from 'sharp';

class FileStorage {
  static async deleteFile(fileName: string, prefixPath?: string, errCallback?: fs.NoParamCallback) {
    if (prefixPath) {
      fs.unlink(`${prefixPath}/${fileName}`, errCallback || (() => null));
    }
  }

  static async saveImageFromBuffer(buffer: Buffer, fileName: string, prefixPath?: string) {
    if (prefixPath) {
      await sharp(buffer).png({ compressionLevel: 6 }).toFile(`${fileName}/${prefixPath}`);
    }
  }
}

// eslint-disable-next-line import/prefer-default-export
export { FileStorage };
