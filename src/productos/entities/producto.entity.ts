import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoriaProducto } from '../enums/categoria-producto.enum';
import { ProductoImagen } from './';
import { TallasValidas } from '../enums/tallas.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Entidad que representa un producto canjeable en la base de datos.
 */
@Entity('productos')
export class Producto {
  /**
   * Identificador único del producto (UUID).
   * @ejemplo "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
   */
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Título o nombre del producto. Debe ser único.
   * @ejemplo "Camisa Polo Oficial Davivienda"
   */
  @Column('text', {
    unique: true,
  })
  @ApiProperty({ example: 'Camisa Polo Oficial Davivienda' })
  title: string;

  /**
   * Costo del producto en puntos de lealtad.
   * @ejemplo 1500
   */
  @Column('float', {
    default: 0,
  })
  @ApiProperty({ example: 1500, type: Number })
  points: number;

  /**
   * Descripción detallada del producto.
   * @ejemplo "Camisa polo de alta calidad con el logo bordado."
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  @ApiPropertyOptional({ example: 'Camisa polo de alta calidad con el logo bordado.' })
  description: string;

  /**
   * Slug del producto para URLs amigables. Debe ser único.
   * @ejemplo "camisa-polo-oficial-davivienda"
   */
  @Column('text', {
    unique: true,
  })
  @ApiProperty({ example: 'camisa-polo-oficial-davivienda' })
  slug: string;

  /**
   * Cantidad de unidades disponibles en inventario.
   * @ejemplo 250
   */
  @Column('int', {
    default: 0,
  })
  @ApiProperty({ example: 250, type: Number })
  stock: number;

  /**
   * Tallas disponibles para el producto (aplica principalmente a ropa).
   * @ejemplo ["S", "M", "L"]
   */
  @Column('text', {
    array: true,
    default: [],
  })
  @ApiPropertyOptional({ enum: TallasValidas, isArray: true, example: ['S','M','L'] })
  sizes: TallasValidas[];

  /**
   * Categoría a la que pertenece el producto.
   * @ejemplo "ropa"
   */
  @Column('text')
  @ApiProperty({ enum: CategoriaProducto, example: CategoriaProducto.ROPA })
  category: CategoriaProducto;

  /**
   * Lista de imágenes asociadas al producto.
   * Relación uno a muchos con la entidad ProductoImagen.
   */
  @OneToMany(() => ProductoImagen, (productoImagen) => productoImagen.producto, {
    cascade: true
  })
  @ApiProperty({
    type: () => [ProductoImagen],
    example: [
      {
        id: 1,
        url: 'https://http2.mlstatic.com/D_NQ_NP_899787-MCO73577433249_122023-O.webp',
        createdAt: '2025-10-08T09:12:22.340Z',
        deletedAt: null,
      },
      {
        id: 2,
        url: 'https://http2.mlstatic.com/D_NQ_NP_673059-MCO73577317549_122023-O.webp',
        createdAt: '2025-10-08T09:12:22.340Z',
        deletedAt: null,
      },
    ],
  })
  images: ProductoImagen[];

  /**
   * Columna para manejar la fecha de creación del registro.
   * Se asigna automáticamente al crear un producto.
   */
  @CreateDateColumn()
  @ApiProperty({ type: String, example: '2025-01-01T12:00:00.000Z' })
  createdAt: Date;

  /**
   * Columna para manejar el borrado lógico (soft delete).
   * Almacena la fecha y hora en que se eliminó el registro.
   */
  @DeleteDateColumn()
  @ApiPropertyOptional({ type: String, example: null })
  deletedAt: Date;

  /**
   * Hook que se ejecuta antes de insertar el producto en la base de datos.
   * Genera un slug a partir del título si no se proporciona uno.
   */
  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }

    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}

