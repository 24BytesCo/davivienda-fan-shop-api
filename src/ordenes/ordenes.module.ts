import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orden } from './entities/orden.entity';
import { OrdenItem } from './entities/orden-item.entity';
import { OrdenesService } from './ordenes.service';
import { OrdenesController } from './ordenes.controller';
import { Carrito } from 'src/carrito/entities/carrito.entity';
import { CarritoItem } from 'src/carrito/entities/carrito-item.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { SaldoPuntos } from 'src/puntos/entities/saldo-puntos.entity';
import { MovimientoPuntos } from 'src/puntos/entities/movimiento-puntos.entity';
import { ConfiguracionModule } from 'src/configuracion/configuracion.module';
import { AuthModule } from 'src/auth/auth.module';

/**
 * Módulo de órdenes y checkout.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Orden, OrdenItem, Carrito, CarritoItem, Producto, SaldoPuntos, MovimientoPuntos]), ConfiguracionModule, AuthModule],
  providers: [OrdenesService],
  controllers: [OrdenesController],
  exports: [TypeOrmModule, OrdenesService],
})
export class OrdenesModule {}

