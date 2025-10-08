import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador que marca un controlador o handler como público.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
