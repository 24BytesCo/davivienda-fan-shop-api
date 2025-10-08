import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// DTO para actualizaciones parciales del usuario
export class UpdateUserDto extends PartialType(CreateUserDto) {}
