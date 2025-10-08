import { ApiProperty } from '@nestjs/swagger';

/**
 * Envoltura estándar de respuestas de la API.
 */
export class StandardResponseDto<T = any> {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: 'Operación exitosa' })
  message: string;

  @ApiProperty({ nullable: true })
  data: T | null;
}

