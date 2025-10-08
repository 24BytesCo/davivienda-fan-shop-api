import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';

/**
 * Decorador para obtener el usuario autenticado desde el request.
 */
export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      throw new InternalServerErrorException(
        'No se encontró el usuario en la request. ¿Olvidaste usar el AuthGuard?',
      );
    }

    return data ? user[data] : user;
  },
);
