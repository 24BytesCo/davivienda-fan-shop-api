import { ApiProperty } from '@nestjs/swagger';
import { RolesUsuario } from '../enum/roles-usuario.enum';

/**
 * Modelo de usuario expuesto (sin contraseña).
 */
export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'usuario@example.com' })
  email: string;

  @ApiProperty({ example: 'Nombre Apellido' })
  fullName: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ enum: RolesUsuario, example: RolesUsuario.USER })
  role: RolesUsuario;
}

