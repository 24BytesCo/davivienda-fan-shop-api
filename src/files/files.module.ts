import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

/**
 * Módulo de archivos: subida y eliminación en almacenamiento externo.
 */
@Module({
  controllers: [FilesController],
  providers: [FilesService],
  // Exporta el servicio para consumo desde otros módulos
  exports: [FilesService],
})
export class FilesModule {}
