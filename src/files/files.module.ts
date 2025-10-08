import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService], // Exporto el servicio para que otros módulos puedan usarlo
})
export class FilesModule {}