import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para iniciar sesión.
 */
export class LoginDto {
  /** Correo electrónico del usuario */
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail()
  email: string;

  /** Contraseña en texto plano para validar */
  @ApiProperty({ example: 'GatoVerde#2025' })
  @IsString()
  @MinLength(6)
  password: string;
}

