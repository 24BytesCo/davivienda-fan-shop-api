import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto';
import { User } from './entities/user.entity';
import { ValidRoles } from 'src/auth/interfaces';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      roles: createUserDto.roles?.length
        ? createUserDto.roles
        : [ValidRoles.USER],
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }

    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['productos'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['productos'],
    });
  }

  sanitizeUser(user: User) {
    if (!user) {
      return null;
    }

    const { password, ...rest } = user;
    return rest;
  }
}
