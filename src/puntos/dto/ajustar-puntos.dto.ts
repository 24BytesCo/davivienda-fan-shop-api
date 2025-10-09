import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class AjustarPuntosDto {
  @ApiProperty({ example: 100, minimum: 1, description: 'Cantidad de puntos a aplicar' })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiPropertyOptional({ example: 'Bonificación por campaña' })
  @IsString()
  @IsOptional()
  concepto?: string;

  @ApiPropertyOptional({ description: 'Referencia a orden asociada', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsOptional()
  ordenId?: string;
}

