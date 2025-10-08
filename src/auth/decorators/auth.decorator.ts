import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../guards';
import { ValidRoles } from '../interfaces';

export const ROLES_KEY = 'roles';

/**
 * Decorador personalizado para proteger rutas utilizando JWT y validación de roles.
 */
export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
