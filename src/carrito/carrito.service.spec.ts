/**
 * Pruebas unitarias del CarritoService.
 *
 * Validaciones:
 * - Agregar ítems respetando stock.
 * - Actualizar cantidades.
 * - Eliminar y limpiar carrito.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CarritoService } from './carrito.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Carrito } from './entities/carrito.entity';
import { CarritoItem } from './entities/carrito-item.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { Repository } from 'typeorm';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  create?: jest.Mock;
};

const productoEj = (over: Partial<Producto> = {}): Producto => ({
  id: 'p1',
  title: 'Prod',
  points: 100,
  description: '',
  slug: 'prod',
  stock: 5,
  sizes: [],
  category: 'ropa' as any,
  images: [],
  createdAt: new Date(),
  deletedAt: null,
  ...over,
} as any);

describe('CarritoService', () => {
  let service: CarritoService;
  let carritoRepo: MockRepo<Carrito>;
  let itemRepo: MockRepo<CarritoItem>;
  let prodRepo: MockRepo<Producto>;

  beforeEach(async () => {
    carritoRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as any;
    itemRepo = {
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    } as any;
    prodRepo = {
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarritoService,
        { provide: getRepositoryToken(Carrito), useValue: carritoRepo },
        { provide: getRepositoryToken(CarritoItem), useValue: itemRepo },
        { provide: getRepositoryToken(Producto), useValue: prodRepo },
      ],
    }).compile();

    service = module.get(CarritoService);

    // Carrito por defecto
    const baseCart = { id: 'c1', userId: 'u1', items: [] } as any;
    carritoRepo.findOne!.mockResolvedValue(baseCart);
  });

  it('agrega ítem si hay stock suficiente', async () => {
    prodRepo.findOne!.mockResolvedValue(productoEj({ stock: 5 }));
    itemRepo.find!.mockResolvedValue([]);
    itemRepo.create!.mockImplementation((o) => o);
    await service.addItem({ userId: 'u1', productoId: 'p1', cantidad: 2 });
    expect(itemRepo.save).toHaveBeenCalled();
  });

  /**
   * Si el producto ya está en el carrito, debe acumular la cantidad respetando el stock.
   */
  it('acumula cantidad cuando el ítem ya existe', async () => {
    prodRepo.findOne!.mockResolvedValue(productoEj({ stock: 5 }));
    itemRepo.find!.mockResolvedValue([
      { id: 'i1', cantidad: 2, producto: { id: 'p1', stock: 5 }, carrito: { id: 'c1' } },
    ] as any);
    await service.addItem({ userId: 'u1', productoId: 'p1', cantidad: 2 });
    expect(itemRepo.save).toHaveBeenCalledWith(expect.objectContaining({ cantidad: 4 }));
  });

  it('rechaza si la suma excede el stock', async () => {
    prodRepo.findOne!.mockResolvedValue(productoEj({ stock: 3 }));
    itemRepo.find!.mockResolvedValue([{ cantidad: 2, producto: { id: 'p1', stock: 3 } }] as any);
    await expect(service.addItem({ userId: 'u1', productoId: 'p1', cantidad: 2 })).rejects.toThrow('Stock insuficiente');
  });

  /**
   * Debe fallar si el producto no existe al intentar agregarlo.
   */
  it('rechaza si el producto no existe', async () => {
    prodRepo.findOne!.mockResolvedValue(null);
    await expect(service.addItem({ userId: 'u1', productoId: 'nope', cantidad: 1 })).rejects.toThrow(
      'Producto no encontrado',
    );
  });

  it('actualiza cantidad dentro del stock', async () => {
    const prod = productoEj({ stock: 5 });
    itemRepo.find!.mockResolvedValue([{ id: 'i1', cantidad: 1, producto: prod, carrito: { id: 'c1' } }] as any);
    await service.updateItem({ userId: 'u1', productoId: 'p1', cantidad: 3 });
    expect(itemRepo.save).toHaveBeenCalledWith(expect.objectContaining({ cantidad: 3 }));
  });

  /**
   * Debe fallar al actualizar si el ítem no está en el carrito.
   */
  it('update falla si ítem no existe', async () => {
    itemRepo.find!.mockResolvedValue([]);
    await expect(service.updateItem({ userId: 'u1', productoId: 'p1', cantidad: 1 })).rejects.toThrow(
      'Ítem no encontrado en el carrito',
    );
  });

  /**
   * Elimina un ítem del carrito si existe, y no falla si no existe.
   */
  it('remove elimina ítem si existe', async () => {
    const prod = productoEj({ stock: 5 });
    itemRepo.find!.mockResolvedValue([{ id: 'i1', cantidad: 1, producto: prod }] as any);
    await service.removeItem('u1', 'p1');
    expect(itemRepo.delete).toHaveBeenCalledWith('i1');
  });

  /**
   * Limpia todos los ítems del carrito según el usuario.
   */
  it('clear limpia el carrito', async () => {
    await service.clear('u1');
    expect(itemRepo.delete).toHaveBeenCalledWith({ carrito: { id: 'c1' } as any });
  });

  /**
   * getCart devuelve totales calculados (puntos y cantidad de ítems).
   */
  it('getCart retorna resumen con totales', async () => {
    const baseCart: any = { id: 'c1', userId: 'u1', items: [] };
    const prod = productoEj({ id: 'p1', points: 10 });
    const withProducts: any = { id: 'c1', userId: 'u1', items: [{ producto: prod, cantidad: 3 }] };
    // Forzar dos respuestas distintas de findOne: 1) carrito base, 2) con productos
    (carritoRepo.findOne as jest.Mock).mockReset();
    (carritoRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(baseCart)
      .mockResolvedValueOnce(withProducts);

    const res = await service.getCart('u1');
    expect(res.summary.totalPoints).toBe(30);
    expect(res.summary.items).toBe(1);
  });
});
