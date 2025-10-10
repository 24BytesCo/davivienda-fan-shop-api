import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { CategoriaProducto } from '../enums/categoria-producto.enum';
import { TallasValidas } from '../enums/tallas.enum';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductoDto {
  /**
   * Nombre del producto.
   * @example "Camisa Polo Davivienda"
   */
  @ApiProperty({ example: 'Camisa Polo Davivienda', minLength: 5 })
  @IsString()
  @MinLength(5)
  @IsNotEmpty()
  title: string;

  /**
   * Costo del producto en puntos de lealtad.
   * Se transforma de string a número automáticamente.
   * @example 1500
   */
  @ApiProperty({ example: 1500, type: Number, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  points: number;

  /**
   * Descripción detallada del producto. Es opcional.
   * @example "Camisa polo de alta calidad con el logo bordado."
   */
  @ApiPropertyOptional({ example: 'Camisa polo de alta calidad con el logo bordado.' })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Slug para la URL amigable del producto.
   * @example "camisa-polo-davivienda"
   */
  @ApiPropertyOptional({ example: 'camisa-polo-davivienda' })
  @IsString()
  @IsOptional()
  slug?: string;

  /**
   * Cantidad de producto en inventario.
   * Se transforma de string a número automáticamente.
   * @example 10
   */
  @ApiProperty({ example: 10, type: Number, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  stock: number;

  /**
   * Categoría a la que pertenece el producto.
   * @example "ropa"
   */
  @ApiProperty({ enum: CategoriaProducto, example: CategoriaProducto.ROPA })
  @IsIn(Object.values(CategoriaProducto))
  @IsNotEmpty()
  category: CategoriaProducto;

  /**
   * Tallas disponibles (solo para la categoría 'ropa'). Es opcional.
   * @example ["S", "M", "L"]
   */
  @ApiPropertyOptional({ enum: TallasValidas, isArray: true, example: ['S', 'M', 'L'] })
  @IsArray()
  @IsIn(Object.values(TallasValidas), { each: true })
  @IsOptional()
  @Transform(({ value }) => {
    // Aceptar: ["M","L"], "M,L", "M", ["M"]
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Intentar JSON primero
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
      // Fallback: split por comas
      return value.split(',').map(v => v.trim()).filter(Boolean);
    }
    return [String(value)];
  })
  sizes?: TallasValidas[];

  /**
   * Arreglo de URLs de las imágenes del producto.
   * @example ["https://ejemplo.com/image1.jpg"]
   */
  @ApiPropertyOptional({ type: [String], example: ['https://ejemplo.com/image1.jpg'] })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  images?: string[];
}

