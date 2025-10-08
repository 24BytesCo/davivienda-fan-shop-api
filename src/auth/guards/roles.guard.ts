import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ValidRoles } from '../interfaces';
import { User } from 'src/users/entities/user.entity';

const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const validRoles = this.reflector.getAllAndMerge<ValidRoles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!validRoles || validRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user || !user.roles) {
      throw new ForbiddenException('Usuario sin roles definidos');
    }

    const hasRole = user.roles.some((role) => validRoles.includes(role as ValidRoles));

    if (!hasRole) {
      throw new ForbiddenException(
        `El usuario requiere uno de los roles: [${validRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
