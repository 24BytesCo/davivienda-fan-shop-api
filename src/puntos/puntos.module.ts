import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuntosController } from './puntos.controller';
import { PuntosService } from './puntos.service';
import { SaldoPuntos } from './entities/saldo-puntos.entity';
import { MovimientoPuntos } from './entities/movimiento-puntos.entity';

@Module({
  controllers: [PuntosController],
  providers: [PuntosService],
  imports: [TypeOrmModule.forFeature([SaldoPuntos, MovimientoPuntos])],
  exports: [TypeOrmModule, PuntosService],
})
export class PuntosModule {}

