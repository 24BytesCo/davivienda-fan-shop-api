import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosModule } from './productos/productos.module';
import { CommonModule } from './common/common.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { CarritoModule } from './carrito/carrito.module';
import { OrdenesModule } from './ordenes/ordenes.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { PuntosModule } from './puntos/puntos.module';

@Module({
  imports: [
    ConfigModule.forRoot(),

    TypeOrmModule.forRoot({
      // Configuración de la base de datos usando variables de entorno
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: process.env.ENV === 'development',
    }),
    ProductosModule,
    CommonModule,
    FilesModule,
    AuthModule,
    OrdenesModule,
    CarritoModule,
    ConfiguracionModule,
    PuntosModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

