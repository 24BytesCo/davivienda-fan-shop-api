import { PartialType } from '@nestjs/mapped-types';
import { CreateProductoDto } from './create-producto.dto';

/**
 * DTO para actualizaciones parciales de productos.
 */
export class UpdateProductoDto extends PartialType(CreateProductoDto) {}
