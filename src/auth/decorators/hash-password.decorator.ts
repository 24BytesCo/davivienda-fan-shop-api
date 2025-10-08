import 'reflect-metadata';

const HASH_PASSWORD_METADATA = 'auth:hash-password';

/**
 * Decorador de propiedad que marca un campo para ser hasheado
 * automáticamente antes de persistirlo en la base de datos.
 */
export function HashPassword(): PropertyDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(HASH_PASSWORD_METADATA, true, target, propertyKey);
  };
}

export function isHashPasswordField(
  target: unknown,
  propertyKey: string | symbol,
): boolean {
  return !!Reflect.getMetadata(HASH_PASSWORD_METADATA, target, propertyKey);
}
