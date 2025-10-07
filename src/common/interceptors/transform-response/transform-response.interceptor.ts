import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Define la estructura de respuesta estándar para la API.
 */
export interface StandardResponse<T> {
  statusCode: number;
  ok: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  
  /**
   * Intercepta la respuesta y la transforma al formato estándar.
   * @param {ExecutionContext} context - Contexto de la petición.
   * @param {CallHandler} next - Objeto para continuar el flujo de la petición.
   * @returns {Observable<StandardResponse<T>>}
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    // Obtenemos el código de estado de la respuesta
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => ({
        statusCode,
        ok: true,
        message: 'Operación exitosa',
        data: data || null, // Si no hay datos, retornamos null
      })),
    );
  }
}
