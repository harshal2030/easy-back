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
      await sharp(buffer).png({ compressionLevel: 6 }).flatten({ background: { r: 255, g: 255, b: 255 } }).toFile(`${prefixPath}/${fileName}`);
    }
  }
}

// eslint-disable-next-line import/prefer-default-export
export { FileStorage };
