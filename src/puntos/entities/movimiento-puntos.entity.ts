import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Movimiento de puntos: débito o crédito.
 */
@Entity('movimientos_puntos')
export class MovimientoPuntos {
  /** Identificador */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Usuario (UUID) */
  @Column('uuid')
  userId: string;

  /** Tipo de movimiento: debito|credito */
  @Column('text')
  tipo: 'debito' | 'credito';

  /** Cantidad de puntos (positiva) */
  @Column('int')
  cantidad: number;

  /** Referencia opcional a orden */
  @Column('uuid', { nullable: true })
  ordenId?: string | null;

  /** Descripción o concepto */
  @Column('text', { nullable: true })
  concepto?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

