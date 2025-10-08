import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Producto } from 'src/productos/entities/producto.entity';
import { HashPassword, isHashPasswordField } from 'src/auth/decorators';
import * as bcrypt from 'bcrypt';

/**
 * Entidad que representa a los usuarios que pueden autenticarse en la API.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  email: string;

  @HashPassword()
  @Column('text')
  password: string;

  @Column('text')
  fullName: string;

  @Column('text', { array: true, default: ['user'] })
  roles: string[];

  @OneToMany(() => Producto, (producto) => producto.owner, {
    cascade: false,
  })
  productos: Producto[];

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  async handleBeforeInsert() {
    await this.normalizeAndHash();
  }

  @BeforeUpdate()
  async handleBeforeUpdate() {
    await this.normalizeAndHash();
  }

  private async normalizeAndHash() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }

    const shouldHash =
      isHashPasswordField(this, 'password') &&
      this.password &&
      !this.password.startsWith('$2b$');

    if (shouldHash) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}
