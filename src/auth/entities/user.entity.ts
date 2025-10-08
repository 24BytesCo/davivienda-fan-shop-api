import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { RolesUsuario } from "../enum/roles-usuario.enum";

/**
 * Entidad persistente de usuarios.
 */
@Entity('users')
export class User {

   /** Identificador único (UUID) */
   @PrimaryGeneratedColumn('uuid')
    id: string;

    /** Correo único del usuario */
    @Column('text', { unique: true })
    email: string;

    /** Hash de la contraseña del usuario */
    @Column('text')
    password: string;

    /** Nombre completo de presentación */
    @Column('text')
    fullName: string;

    /** Estado de activación */
    @Column('boolean', {
        default: true
    })
    isActive: boolean;

    /** Rol del usuario según dominio */
    @Column('text',{
        default: RolesUsuario.USER
    })
    role: RolesUsuario;

}
