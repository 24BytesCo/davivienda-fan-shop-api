import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsUUID } from 'class-validator';

/**
 * DTO para actualizar la cantidad de un ítem.
 */
export class UpdateItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productoId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @IsPositive()
  cantidad: number;
}

