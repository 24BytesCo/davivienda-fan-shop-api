import { applyDecorators, Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards';

/**
 * Decorador de clase que combina @Controller con @UseGuards para proteger
 * todos los handlers del controlador por defecto.
 */
export function ProtectedController(path?: string): ClassDecorator {
  return applyDecorators(Controller(path), UseGuards(JwtAuthGuard));
}
