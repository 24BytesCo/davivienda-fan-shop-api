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

export class CreateProductoDto {
  /**
   * Nombre del producto.
   * @ejemplo "Camisa Polo Davivienda"
   */
  @IsString()
  @MinLength(5)
  @IsNotEmpty()
  title: string;

  /**
   * Costo del producto en puntos de lealtad.
   * @ejemplo 1500
   */
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  points: number;

  /**
   * Descripción detallada del producto. Es opcional.
   * @ejemplo "Camisa polo de alta calidad con el logo bordado."
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Slug para la URL amigable del producto.
   * @ejemplo "camisa-polo-davivienda"
   */
  @IsString()
  @IsOptional()
  slug?: string;

  /**
   * Cantidad de producto en inventario.
   * @ejemplo 10
   */
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  stock: number;

  /**
   * Categoría a la que pertenece el producto.
   * @ejemplo "ropa"
   */
  @IsIn(Object.values(CategoriaProducto))
  @IsNotEmpty()
  category: CategoriaProducto;

  /**
   * Tallas disponibles (solo para la categoría 'ropa'). Es opcional.
   * @ejemplo ["S", "M", "L"]
   */
  @IsArray()
  @IsIn(Object.values(TallasValidas), { each: true })
  @IsOptional()
  sizes?: TallasValidas[];

  /**
   * Arreglo de URLs de las imágenes del producto.
   * @ejemplo ["https://ejemplo.com/image1.jpg"]
   */
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  images?: string[];
}
