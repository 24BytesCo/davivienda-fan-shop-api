import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { RolesUsuario } from "../enum/roles-usuario.enum";

/**
 * DTO para crear usuarios (registro público o creación por roles).
 */
export class CreateUserDto {

    /** Correo electrónico válido y normalizable */
    @IsString()
    @IsEmail()
    email: string;

    /** Contraseña fuerte (mín. 12, mayúscula, minúscula, dígito, especial, sin espacios) */
    @IsString()
    @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{12,}$/, {
        message: 'La contraseña debe incluir mayúscula, minúscula, número, carácter especial y no contener espacios',
    })
    password: string;

    /** Nombre completo legible */
    @IsString()
    @MinLength(3, { message: 'El nombre completo debe tener al menos 3 caracteres' })
    @MaxLength(100, { message: 'El nombre completo no debe exceder 100 caracteres' })
    fullName: string;

    /** Rol solicitado (opcional). Si falta y no hay creador, será "usuario" */
    @IsOptional()
    @IsEnum(RolesUsuario, { message: 'El rol es inválido' })
    role?: RolesUsuario;

    /** Rol del creador (opcional). Ausente => registro público */
    @IsOptional()
    @IsEnum(RolesUsuario, { message: 'El rol del creador es inválido' })
    creatorRole?: RolesUsuario;
}
