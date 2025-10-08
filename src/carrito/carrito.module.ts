import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrito } from './entities/carrito.entity';
import { CarritoItem } from './entities/carrito-item.entity';
import { CarritoService } from './carrito.service';
import { CarritoController } from './carrito.controller';
import { Producto } from 'src/productos/entities/producto.entity';

/**
 * Módulo de carrito de compras.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Carrito, CarritoItem, Producto])],
  providers: [CarritoService],
  controllers: [CarritoController],
  exports: [TypeOrmModule, CarritoService],
})
export class CarritoModule {}

