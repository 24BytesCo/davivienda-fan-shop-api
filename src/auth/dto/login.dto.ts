import { IsEmail, IsString, MinLength } from 'class-validator';

// DTO para iniciar sesión
export class LoginDto {
  // Correo electrónico del usuario
  @IsEmail()
  email: string;

  // Contraseña en texto plano para validar
  @IsString()
  @MinLength(6)
  password: string;
}
