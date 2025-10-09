import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

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

  private extractBearer(header: string): string | null {
    const parts = header.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
    return null;
  }
}

