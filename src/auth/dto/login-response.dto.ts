import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

/**
 * Modelo de respuesta para login.
 */
export class LoginResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;
}

