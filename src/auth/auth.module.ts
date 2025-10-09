import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { FirstUserSeeder } from './providers/first-user.seeder';
import { AdminGuard } from './guards/admin.guard';
import { JwtGuard } from './guards/jwt.guard';

/**
 * Módulo de autenticación: controladores, servicios y configuración JWT.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService, FirstUserSeeder, AdminGuard, JwtGuard],
  imports: [
        // Acceso a variables de entorno
        ConfigModule,
        // Emisión de JWT con configuración desde .env
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN},
          }),
        }),
        // Repositorio de la entidad User
        TypeOrmModule.forFeature([User]),
  ],
  exports: [TypeOrmModule, JwtModule, AdminGuard, JwtGuard],
})
export class AuthModule {}
