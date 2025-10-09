import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RolesUsuario } from '../enum/roles-usuario.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = (req.headers?.authorization ?? '') as string;
    const token = this.extractBearer(auth);
    if (!token) throw new UnauthorizedException('Token no proporcionado');
    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (!payload || payload.role !== RolesUsuario.ADMIN) {
        throw new ForbiddenException('Requiere rol administrador');
      }
      req.user = payload;
      return true;
    } catch (e) {
      // If it's an Unauthorized or Forbidden, rethrow; otherwise standardize
      if (e instanceof UnauthorizedException || e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private extractBearer(header: string): string | null {
    const parts = header.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
    return null;
  }
}

