import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * Configuración simple con clave/valor numérico.
 */
@Entity('configuracion')
@Unique(['clave'])
export class Configuracion {
  /** Identificador */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Clave de configuración */
  @Column('text')
  clave: string;

  /** Valor numérico asociado */
  @Column('float')
  valorNumero: number;
}

