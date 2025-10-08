import { Module } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto, ProductoImagen} from './entities';
import { FilesModule } from 'src/files/files.module';

/**
 * Módulo de productos: controladores, servicios y persistencia.
 */
@Module({
  controllers: [ProductosController],
  providers: [ProductosService],
  imports: [
    TypeOrmModule.forFeature([Producto, ProductoImagen]),
    FilesModule
  ],
})
export class ProductosModule {}
