import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { RolesUsuario } from '../enum/roles-usuario.enum';
import * as bcrypt from 'bcryptjs';

/**
 * Seeder: crea un usuario inicial si no existen usuarios.
 */
@Injectable()
export class FirstUserSeeder implements OnModuleInit {
  private readonly logger = new Logger(FirstUserSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  /** Hook de inicialización del módulo. */
  async onModuleInit() {
    const count = await this.usersRepository.count();
    if (count > 0) return; // Ya existen usuarios

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const fullName = process.env.ADMIN_FULLNAME;
    const roleEnv = process.env.ADMIN_ROLE || process.env.ADMIN_ROLES;

    if (!email || !password || !fullName) {
      // Requiere variables mínimas para proceder
      return;
    }

    const role = this.resolveRole(roleEnv);

    try {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      const user = this.usersRepository.create({
        email: email.toLowerCase().trim(),
        password: hashed,
        fullName,
        role,
      });
      await this.usersRepository.save(user);
      this.logger.log(`Usuario inicial creado: ${email} (rol: ${role})`);
    } catch (err) {
      this.logger.error('No se pudo crear el usuario inicial', err instanceof Error ? err.stack : String(err));
    }
  }

  /** Normaliza cadena de rol hacia el enum del dominio. */
  private resolveRole(roleEnv?: string): RolesUsuario {
    switch ((roleEnv ?? '').toLowerCase().trim()) {
      case 'administrador':
      case 'admin':
        return RolesUsuario.ADMIN;
      case 'editor':
        return RolesUsuario.EDITOR;
      case 'usuario':
      case 'user':
        return RolesUsuario.USER;
      default:
        return RolesUsuario.ADMIN; // valor por defecto
    }
  }
}
