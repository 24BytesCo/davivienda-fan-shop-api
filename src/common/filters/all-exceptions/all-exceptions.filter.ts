import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // Captura TODAS las excepciones, no solo las HttpException
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * Captura y procesa todas las excepciones no controladas de la aplicación.
   * @param {any} exception - La excepción lanzada.
   * @param {ArgumentsHost} host - El contexto de la petición.
   */
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let responseBody: any;

    // Caso 1: La excepción ya es una HttpException (ej. NotFoundException)
    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();
      responseBody = {
        statusCode: status,
        ok: false,
        ...(typeof errorResponse === 'object' ? errorResponse : { message: errorResponse }),
        data: null,
      };
      
    // Caso 2: Es un error de la base de datos (con la propiedad 'code')
    } else if (exception.code) {
      this.logger.error('Error de base de datos detectado', exception.stack);
      
      switch (exception.code) {
        case '23505': // unique_violation
          status = HttpStatus.CONFLICT;
          responseBody = {
            statusCode: status,
            ok: false,
            message: 'Ya existe un registro con los valores proporcionados.',
            error: 'Conflict',
            detalle: exception.detail,
            data: null,
          };
          break;
        
        // Otros errores de BD que son Bad Request
        case '23503': // foreign_key_violation
        case '23502': // not_null_violation
        case '22P02': // invalid_text_representation
          status = HttpStatus.BAD_REQUEST;
          responseBody = {
            statusCode: status,
            ok: false,
            message: this.getBadRequestMessage(exception.code),
            error: 'Bad Request',
            detalle: exception.detail || exception.message,
            data: null,
          };
          break;

        default:
          responseBody = {
            statusCode: status,
            ok: false,
            message: 'Error inesperado de base de datos.',
            data: null,
          };
      }
    
    // Caso 3: Es un error genérico no controlado
    } else {
      this.logger.error('Error no controlado', exception.stack);
      responseBody = {
        statusCode: status,
        ok: false,
        message: 'Error interno del servidor. Contacte al administrador.',
        data: null,
      };
    }
    
    response.status(status).json(responseBody);
  }
  
  /**
   * Genera mensajes para errores de tipo BadRequest de la BD.
   * @param {string} code - Código de error de PostgreSQL.
   * @private
   */
  private getBadRequestMessage(code: string): string {
    switch (code) {
      case '23503':
        return 'La referencia a una entidad externa no es válida.';
      case '23502':
        return 'Uno de los campos requeridos está vacío o es nulo.';
      case '22P02':
        return 'El formato de uno de los valores enviados es incorrecto.';
      default:
        return 'La solicitud contiene datos incorrectos.';
    }
  }
}