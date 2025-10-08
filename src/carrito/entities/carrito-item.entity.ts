import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Carrito } from './carrito.entity';
import { Producto } from 'src/productos/entities/producto.entity';

/**
 * Ítem dentro del carrito (producto + cantidad).
 */
@Entity('carrito_items')
export class CarritoItem {
  /** Identificador del ítem */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Relación con el carrito */
  @ManyToOne(() => Carrito, (carrito) => carrito.items, { onDelete: 'CASCADE' })
  carrito: Carrito;

  /** Producto asociado al ítem */
  @ManyToOne(() => Producto, { eager: true, onDelete: 'RESTRICT' })
  producto: Producto;

  /** Cantidad del producto en el carrito */
  @Column('int', { default: 1 })
  cantidad: number;
}

