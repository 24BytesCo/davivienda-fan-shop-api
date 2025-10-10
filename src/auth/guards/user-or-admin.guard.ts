import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Guard que permite la operación si:
 * - El usuario es administrador, o
 * - El `userId` destino (en params/body) coincide con `req.user.sub`.
 */
@Injectable()
export class UserOrAdminGuard implements CanActivate {
  /** Valida el contexto contra el usuario autenticado. */
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { sub: string; role?: string } | undefined;
    if (!user) throw new ForbiddenException('No autorizado');

    const isAdmin = (user.role ?? '').toLowerCase() === 'administrador';
    if (isAdmin) return true;

    // Buscar userId en params o body
    const paramUserId = req.params?.userId as string | undefined;
    const bodyUserId = req.body?.userId as string | undefined;
    const target = paramUserId || bodyUserId;
    if (target && target === user.sub) return true;

    throw new ForbiddenException('Operación permitida solo para el propio usuario o administradores');
  }
}
