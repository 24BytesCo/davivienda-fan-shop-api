/**
 * Pruebas unitarias para AuthService.
 *
 * Objetivo:
 * - Validar creación de usuarios (normalización, duplicados, reglas de rol, hash y sanitización).
 * - Validar flujo de login (credenciales válidas/ inválidas) y emisión de JWT.
 *
 * Notas:
 * - `bcryptjs` se mockea para evitar cómputo real de hash y facilitar aserciones.
 * - El repositorio de User y JwtService se simulan con Jest.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
jest.mock('bcryptjs', () => ({
  __esModule: true,
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));
import { RolesUsuario } from './enum/roles-usuario.enum';

/**
 * Tipo de repositorio simulado para facilitar los mocks de TypeORM.
 */
type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  create?: jest.Mock;
};

/**
 * Crea un usuario de ejemplo permitiendo sobreescribir propiedades específicas.
 */
const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'uuid-user',
  email: 'user@example.com',
  password: 'hashed',
  fullName: 'Nombre Apellido',
  role: RolesUsuario.USER,
  createdAt: new Date(),
  deletedAt: null,
  ...overrides,
} as any);

/**
 * Suite principal de pruebas del servicio de autenticación.
 */
describe('AuthService', () => {
  let service: AuthService;
  let repo: MockRepo<User>;
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as any;

    jwt = { signAsync: jest.fn().mockResolvedValue('token-123') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Debe crear un usuario público con rol USER por defecto,
   * y retornar el objeto sin exponer el campo `password`.
   */
  it('crea usuario público con rol USER y retorna sin password', async () => {
    repo.findOne!.mockResolvedValue(null);
    const toCreate = createUser({ password: undefined as any }) as any;
    repo.create!.mockReturnValue(toCreate);
    repo.save!.mockResolvedValue(createUser());

    const result = await service.create({
      email: 'User@Example.com ',
      password: 'StrongP@ssword#2025',
      fullName: 'Nombre Apellido',
    } as any);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(result).toMatchObject({ email: 'user@example.com', role: RolesUsuario.USER });
    expect((result as any).password).toBeUndefined();
  });

  /**
   * Si el email ya existe, debe lanzar una excepción de conflicto.
   */
  it('lanza conflicto si email ya existe', async () => {
    repo.findOne!.mockResolvedValue(createUser());
    await expect(
      service.create({ email: 'user@example.com', password: 'x', fullName: 'n' } as any),
    ).rejects.toThrow('El correo ya está registrado');
  });

  /**
   * Cuando el creador es EDITOR, no puede asignar roles distintos de USER.
   */
  it('EDITOR no puede crear ADMIN', async () => {
    repo.findOne!.mockResolvedValue(null);
    repo.create!.mockReturnValue(createUser());
    repo.save!.mockResolvedValue(createUser());

    await expect(
      service.create({
        email: 'user@example.com',
        password: 'StrongP@ssword#2025',
        fullName: 'Nombre Apellido',
        creatorRole: RolesUsuario.EDITOR,
        role: RolesUsuario.ADMIN,
      } as any),
    ).rejects.toThrow('Un editor solo puede crear usuarios');
  });

  /**
   * Cuando el creador es ADMIN, puede asignar el rol solicitado (p. ej., EDITOR).
   */
  it('ADMIN puede crear EDITOR', async () => {
    repo.findOne!.mockResolvedValue(null);
    repo.create!.mockReturnValue(createUser({ role: RolesUsuario.EDITOR }));
    repo.save!.mockResolvedValue(createUser({ role: RolesUsuario.EDITOR }));

    const created = await service.create({
      email: 'user@example.com',
      password: 'StrongP@ssword#2025',
      fullName: 'Nombre Apellido',
      creatorRole: RolesUsuario.ADMIN,
      role: RolesUsuario.EDITOR,
    } as any);

    expect(created.role).toBe(RolesUsuario.EDITOR);
  });

  /**
   * En login exitoso, retorna token JWT y el usuario sin `password`.
   */
  it('login exitoso devuelve token y usuario sanitizado', async () => {
    repo.findOne!.mockResolvedValue(createUser());
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const { user, token } = await service.login({ email: 'user@example.com', password: 'pw' } as any);
    expect(jwt.signAsync).toHaveBeenCalled();
    expect(user.password).toBeUndefined();
    expect(token).toBe('token-123');
  });

  /**
   * Debe fallar si el usuario no existe para el email dado.
   */
  it('login falla si usuario no existe', async () => {
    repo.findOne!.mockResolvedValue(null);
    await expect(service.login({ email: 'nobody@example.com', password: 'x' } as any)).rejects.toThrow(
      'Credenciales inválidas',
    );
  });

  /**
   * Debe fallar si la contraseña no coincide.
   */
  it('login falla si password incorrecto', async () => {
    repo.findOne!.mockResolvedValue(createUser());
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.login({ email: 'user@example.com', password: 'bad' } as any)).rejects.toThrow(
      'Credenciales inválidas',
    );
  });
});

