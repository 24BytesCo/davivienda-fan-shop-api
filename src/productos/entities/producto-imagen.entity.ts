import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Producto } from './producto.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('producto_imagenes')
export class ProductoImagen {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'https://http2.mlstatic.com/D_NQ_NP_899787-MCO73577433249_122023-O.webp' })
  @Column('text')
  url: string;

  /**
   * Columna para manejar la fecha de creación del registro.
   * Se asigna automáticamente al crear una imagen.
   */
  @ApiProperty({ type: String, example: '2025-10-08T09:12:22.340Z' })
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Columna para manejar el borrado lógico (soft delete).
   * Almacena la fecha y hora en que se eliminó el registro.
   */
  @ApiPropertyOptional({ type: String, example: null })
  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Producto, (producto) => producto.images, {
    onDelete: 'CASCADE',
  })
  producto: Producto;
}
