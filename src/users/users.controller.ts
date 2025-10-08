import { Get, NotFoundException, Param } from '@nestjs/common';
import { ProtectedController } from 'src/auth/decorators';
import { UsersService } from './users.service';
import { GetUser, Auth } from 'src/auth/decorators';
import { User } from './entities/user.entity';
import { ValidRoles } from 'src/auth/interfaces';

@ProtectedController('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@GetUser() user: User) {
    return this.usersService.sanitizeUser(user);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.usersService.sanitizeUser(user);
  }
}
