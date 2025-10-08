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
import { Type } from 'class-transformer';

export class CreateProductoDto {
  /**
   * Nombre del producto.
   * @example "Camisa Polo Davivienda"
   */
  @IsString()
  @MinLength(5)
  @IsNotEmpty()
  title: string;

  /**
   * Costo del producto en puntos de lealtad.
   * Se transforma de string a número automáticamente.
   * @example 1500
   */
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  points: number;

  /**
   * Descripción detallada del producto. Es opcional.
   * @example "Camisa polo de alta calidad con el logo bordado."
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Slug para la URL amigable del producto.
   * @example "camisa-polo-davivienda"
   */
  @IsString()
  @IsOptional()
  slug?: string;

  /**
   * Cantidad de producto en inventario.
   * Se transforma de string a número automáticamente.
   * @example 10
   */
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  stock: number;

  /**
   * Categoría a la que pertenece el producto.
   * @example "ropa"
   */
  @IsIn(Object.values(CategoriaProducto))
  @IsNotEmpty()
  category: CategoriaProducto;

  /**
   * Tallas disponibles (solo para la categoría 'ropa'). Es opcional.
   * @example ["S", "M", "L"]
   */
  @IsArray()
  @IsIn(Object.values(TallasValidas), { each: true })
  @IsOptional()
  sizes?: TallasValidas[];

  /**
   * Arreglo de URLs de las imágenes del producto.
   * @example ["https://ejemplo.com/image1.jpg"]
   */
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  images?: string[];
}