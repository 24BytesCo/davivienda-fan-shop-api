import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

/**
 * Saldo de puntos por usuario.
 */
@Entity('saldo_puntos')
export class SaldoPuntos {
  /** Usuario (UUID) */
  @PrimaryColumn('uuid')
  userId: string;

  /** Saldo actual de puntos */
  @Column('int', { default: 0 })
  saldo: number;

  /** Última actualización */
  @UpdateDateColumn()
  updatedAt: Date;
}
