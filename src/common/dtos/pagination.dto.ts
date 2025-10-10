import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de paginación estándar para endpoints de listados.
 */
export class PaginationDto {
  @ApiPropertyOptional({ description: 'Cantidad de resultados a devolver', minimum: 1, example: 10 })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Número de elementos a omitir', minimum: 0, example: 0 })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}

