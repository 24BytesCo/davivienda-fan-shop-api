import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { ApiBody, ApiCreatedResponse, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { StandardResponseDto } from 'src/common/dtos/standard-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';

/**
 * Controlador de autenticación: registro y login.
 */
@ApiTags('Auth')
@ApiExtraModels(StandardResponseDto, UserResponseDto, LoginResponseDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registra un usuario. Sin creador autenticado, asigna rol "usuario".
   */
  @Post('register')
  @ApiOperation({ summary: 'Registro de usuario' })
  @ApiCreatedResponse({
    description: 'Usuario creado',
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(UserResponseDto) },
          },
        },
      ],
    },
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.authService.create(createUserDto);
  }

  /**
   * Inicia sesión y devuelve usuario (sin contraseña) y token JWT.
   */
  @Post('login')
  @ApiOperation({ summary: 'Inicio de sesión' })
  @ApiOkResponse({
    description: 'Login exitoso',
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(LoginResponseDto) },
          },
        },
      ],
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
 
  
}
