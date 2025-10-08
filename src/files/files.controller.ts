import { Controller, Post, UploadedFiles, UseInterceptors, Body, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { DeleteFileDto } from './dtos/delete-file.dto';
import { ApiBody, ApiConsumes, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { StandardResponseDto } from 'src/common/dtos/standard-response.dto';

/**
 * Controlador para carga y borrado de archivos.
 */
@ApiTags('Archivos')
@ApiExtraModels(StandardResponseDto)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Endpoint para subir múltiples imágenes.
   * @param {Express.Multer.File[]} files - Archivos de imagen.
   */
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files')) // 'files' es el `name` del campo en el form-data
  @ApiOperation({ summary: 'Subir múltiples archivos' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
      required: ['files'],
    },
  })
  @ApiOkResponse({
    description: 'URLs públicas de los archivos subidos',
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        { properties: { data: { type: 'array', items: { type: 'string', example: 'https://storage.googleapis.com/bucket/uuid.png' } } } },
      ],
    },
  })
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return this.filesService.uploadFiles(files);
  }

  /**
   * Endpoint para eliminar un lote de imágenes basado en sus URLs.
   * @param {DeleteFileDto} deleteFileDto - DTO con el arreglo de URLs a eliminar.
   */
  @Delete('delete-batch')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar archivos por URLs' })
  @ApiNoContentResponse({ description: 'Eliminación en lote realizada' })
  deleteFiles(@Body() deleteFileDto: DeleteFileDto) {
    return this.filesService.deleteFiles(deleteFileDto.urls);
  }
}
