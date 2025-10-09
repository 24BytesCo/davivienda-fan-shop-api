import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RolesUsuario } from './enum/roles-usuario.enum';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

/**
 * Servicio de autenticación: registro, validación y emisión de JWT.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Crea un usuario aplicando reglas de rol y hash de contraseña.
   * - Normaliza el correo a minúsculas y sin espacios.
   * - Valida duplicados.
   * - Determina el rol final según el rol del creador y el solicitado.
   * - Hashea la contraseña antes de persistir.
   */
  async create(createUserDto: CreateUserDto) {
    const { email, password, fullName } = createUserDto;

    const existing = await this.usersRepository.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const desiredRole = this.resolveDesiredRole(createUserDto);

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Crea y guarda el usuario
    const user = this.usersRepository.create({
      email: email.toLowerCase().trim(),
      password: hashed,
      fullName,
      role: desiredRole,
    });

    const saved = await this.usersRepository.save(user);
    return this.sanitize(saved);
  }

  /**
   * Determina el rol final a asignar según el rol del creador.
   * Reglas:
   * - Público (sin creatorRole): siempre USER.
   * - ADMIN: puede asignar cualquier rol.
   * - EDITOR: solo puede asignar USER.
   * - Otros: solo USER.
   */
  private resolveDesiredRole(dto: CreateUserDto): RolesUsuario {
    const creator = dto.creatorRole;
    const requested = dto.role ?? RolesUsuario.USER;

    if (!creator) {
      return RolesUsuario.USER;
    }

    if (creator === RolesUsuario.ADMIN) {
      return requested;
    }

    if (creator === RolesUsuario.EDITOR) {
      if (requested !== RolesUsuario.USER) {
        throw new ForbiddenException('Un editor solo puede crear usuarios');
      }
      return RolesUsuario.USER;
    }

    if (requested !== RolesUsuario.USER) {
      throw new ForbiddenException('No tienes permisos para crear ese rol');
    }
    return RolesUsuario.USER;
  }

  /**
   * Remueve datos sensibles del usuario persistido.
   */
  private sanitize(user: User) {
    const { password, ...rest } = user as any;
    return rest;
  }

  async listActiveUsers() {
    const users = await this.usersRepository.find({ where: { isActive: true } });
    return users.map((u) => this.sanitize(u));
  }

  /**
   * Valida credenciales y emite un JWT.
   */
  async login({ email, password }: LoginDto) {
    const user = await this.usersRepository.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      user: this.sanitize(user),
      token,
    };
  }
}

