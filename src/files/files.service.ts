import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Importa las credenciales de Firebase
import serviceAccount from '../../firebase-credentials.json';

/**
 * Servicio de integración con Firebase Storage para subir y eliminar archivos.
 */
@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly bucket;

  /**
   * Constructor que inicializa la conexión con Firebase Admin SDK.
   */
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
    this.bucket = admin.storage().bucket();
  }

  /**
   * Sube múltiples archivos a Firebase Storage.
   * @param {Express.Multer.File[]} files - Arreglo de archivos a subir.
   * @returns {Promise<string[]>} - Un arreglo de URLs públicas de los archivos subidos.
   */
  async uploadFiles(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Sube un único archivo a Firebase Storage.
   * @param {File} file - El archivo a subir.
   * @returns {Promise<string>} - La URL pública del archivo subido.
   */
  private async uploadFile(file:  Express.Multer.File): Promise<string> {
    const originalName = file.originalname;
    const fileExtension = originalName.split('.').pop();
    const newFileName = `${uuidv4()}.${fileExtension}`;
    const blob = this.bucket.file(newFileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        this.logger.error(`Error al subir archivo: ${error}`);
        reject(new InternalServerErrorException('No se pudo subir el archivo.'));
      });

      blobStream.on('finish', async () => {
        try {
          // Hacemos el archivo público para obtener la URL
          await blob.makePublic();
          const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${blob.name}`;
          resolve(publicUrl);
        } catch (error) {
          this.logger.error(`Error al hacer público el archivo: ${error}`);
          reject(new InternalServerErrorException('No se pudo obtener la URL del archivo.'));
        }
      });

      blobStream.end(file.buffer);
    });
  }
  
  /**
   * Elimina un lote de archivos de Firebase Storage a partir de sus URLs.
   * @param {string[]} urls - Las URLs de los archivos a eliminar.
   * @returns {Promise<void>}
   */
  async deleteFiles(urls: string[]): Promise<void> {
    if (!urls || urls.length === 0) return;

    const deletePromises = urls.map(url => this.deleteFileByUrl(url));

    try {
      await Promise.all(deletePromises);
    } catch (error) {
      this.logger.error('Ocurrió un error al eliminar uno o más archivos.', error);
      // Dependiendo de la criticidad, puedes decidir si relanzar la excepción
      // o solo registrarla. Por ahora, la registramos.
    }
  }

  /**
   * Extrae el nombre del archivo de una URL de Firebase Storage y lo elimina.
   * @param {string} url - La URL completa del archivo.
   * @private
   */
  private async deleteFileByUrl(url: string): Promise<void> {
    try {
      const bucketName = this.bucket.name;
      // La URL tiene el formato https://storage.googleapis.com/BUCKET_NAME/FILE_NAME
      const fileName = url.split(`${bucketName}/`)[1];

      if (!fileName) {
        this.logger.warn(`No se pudo extraer el nombre del archivo de la URL: ${url}`);
        return;
      }
      
      const file = this.bucket.file(fileName);
      await file.delete();
    } catch (error) {
      // Si el error es 'not found', lo ignoramos, puede que ya haya sido borrado.
      if (error.code === 404) {
        this.logger.warn(`El archivo en la URL ${url} no fue encontrado para eliminar.`);
      } else {
        this.logger.error(`Error al eliminar el archivo de la URL ${url}:`, error);
        throw new InternalServerErrorException('Error al eliminar un archivo de almacenamiento.');
      }
    }
  }
}
