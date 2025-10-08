import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuracion } from './entities/configuracion.entity';
import { ConfiguracionService } from './configuracion.service';
import { ConfiguracionController } from './configuracion.controller';

/**
 * Módulo de configuración del sistema.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Configuracion])],
  providers: [ConfiguracionService],
  controllers: [ConfiguracionController],
  exports: [TypeOrmModule, ConfiguracionService],
})
export class ConfiguracionModule {}

