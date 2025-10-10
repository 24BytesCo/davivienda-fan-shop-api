import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EstadoOrden } from "../enums/estado-orden.enum";
import { OrdenItem } from "./orden-item.entity";

/** Modo de pago de la orden. */
export enum ModoPago {
  PUNTOS = 'puntos',
  DINERO = 'dinero',
}

/** Orden de compra generada en checkout. */
@Entity('ordenes')
export class Orden {
  /** Identificador de la orden */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Usuario dueño de la orden */
  @Column('uuid')
  userId: string;

  /** Total de puntos a pagar */
  @Column('int')
  totalPoints: number;

  /** Total en COP si el modo de pago es dinero */
  @Column('int', { nullable: true })
  totalCop?: number | null;

  /** Modo de pago seleccionado */
  @Column('text')
  modoPago: ModoPago;

  /** Estado actual de la orden */
  @Column('text')
  estado: EstadoOrden;

  /** Ítems de la orden */
  @OneToMany(() => OrdenItem, (it) => it.orden, { cascade: true, eager: true })
  items: OrdenItem[];

  /** Fecha de creación */
  @CreateDateColumn()
  createdAt: Date;
}

