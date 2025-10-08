import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class DeleteFileDto {
  /**
   * Arreglo de URLs completas de los archivos a eliminar en Firebase Storage.
   * @example ["https://storage.googleapis.com/bucket-name/folder/image1.jpg", "https://storage.googleapis.com/bucket-name/folder/image2.jpg"]
   */
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  urls: string[];
}