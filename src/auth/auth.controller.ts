import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';

// Controlador de endpoints públicos de autenticación
@Controller('auth')
export class AuthController {
  // Inyección del servicio de autenticación
  constructor(private readonly authService: AuthService) {}

  // Registro de usuarios. Si no hay creador autenticado, asigna rol "usuario"
  @Post('register')
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.authService.create(createUserDto);
  }

  // Inicio de sesión. Devuelve usuario sin contraseña y token JWT
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
 
  
}
