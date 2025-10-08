import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Producto } from './producto.entity';

@Entity('producto_imagen')
export class ProductoImagen {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  url: string;

  /**
   * Columna para manejar la fecha de creación del registro.
   * Se asigna automáticamente al crear una imagen.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Columna para manejar el borrado lógico (soft delete).
   * Almacena la fecha y hora en que se eliminó el registro.
   */
  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Producto, (producto) => producto.images, {
    onDelete: 'CASCADE',
  })
  producto: Producto;
}
