import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Orden } from './orden.entity';
import { Producto } from 'src/productos/entities/producto.entity';

/**
 * Ítem individual dentro de una orden.
 */
@Entity('orden_items')
export class OrdenItem {
  /** Identificador del ítem */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Orden asociada */
  @ManyToOne(() => Orden, (o) => o.items, { onDelete: 'CASCADE' })
  orden: Orden;

  /** Producto asociado, para referencia */
  @ManyToOne(() => Producto, { eager: true, onDelete: 'RESTRICT' })
  producto: Producto;

  /** Cantidad del producto */
  @Column('int')
  cantidad: number;

  /** Puntos por unidad en el momento de la compra */
  @Column('int')
  pointsUnit: number;
}

