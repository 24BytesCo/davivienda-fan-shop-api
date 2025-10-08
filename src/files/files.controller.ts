import { Controller, Post, UploadedFiles, UseInterceptors, Body, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { DeleteFileDto } from './dtos/delete-file.dto';

/**
 * Controlador para carga y borrado de archivos.
 */
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Endpoint para subir múltiples imágenes.
   * @param {Express.Multer.File[]} files - Archivos de imagen.
   */
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files')) // 'files' es el `name` del campo en el form-data
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return this.filesService.uploadFiles(files);
  }

  /**
   * Endpoint para eliminar un lote de imágenes basado en sus URLs.
   * @param {DeleteFileDto} deleteFileDto - DTO con el arreglo de URLs a eliminar.
   */
  @Delete('delete-batch')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFiles(@Body() deleteFileDto: DeleteFileDto) {
    return this.filesService.deleteFiles(deleteFileDto.urls);
  }
}
