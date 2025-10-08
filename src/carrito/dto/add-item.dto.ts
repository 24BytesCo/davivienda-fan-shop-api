import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsUUID } from 'class-validator';

/**
 * DTO para agregar un producto al carrito.
 */
export class AddItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productoId: string;

  @ApiProperty({ minimum: 1, default: 1 })
  @IsInt()
  @IsPositive()
  cantidad: number;
}

