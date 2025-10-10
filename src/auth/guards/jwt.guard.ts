import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Guard básico que exige un JWT válido y lo adjunta en `req.user`.
 */
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Permite la ejecución si el token es válido. Adjunta el payload a la request.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = (req.headers?.authorization ?? '') as string;
    const token = this.extractBearer(auth);
    if (!token) throw new UnauthorizedException('Token no proporcionado');
    try {
      const payload = await this.jwtService.verifyAsync(token);
      req.user = payload;
      return true;
    } catch (_) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /** Extrae el token de un header Authorization: Bearer <token>. */
  private extractBearer(header: string): string | null {
    const parts = header.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
    return null;
  }
}

