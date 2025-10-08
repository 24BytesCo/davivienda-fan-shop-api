import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CarritoItem } from './carrito-item.entity';

/**
 * Carrito de compras por usuario.
 */
@Entity('carritos')
@Unique(['userId'])
export class Carrito {
  /** Identificador único del carrito */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Usuario propietario del carrito */
  @Column('uuid')
  userId: string;

  /** Items contenidos en el carrito */
  @OneToMany(() => CarritoItem, (item) => item.carrito, { cascade: true })
  items: CarritoItem[];

  /** Fecha de creación del carrito */
  @CreateDateColumn()
  createdAt: Date;
}

