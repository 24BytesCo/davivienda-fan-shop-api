/**
 * Pruebas unitarias de OrdenesService (checkout básico).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { OrdenesService } from './ordenes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfiguracionService } from 'src/configuracion/configuracion.service';
import { Orden, ModoPago } from './entities/orden.entity';
import { OrdenItem } from './entities/orden-item.entity';
import { Carrito } from 'src/carrito/entities/carrito.entity';
import { CarritoItem } from 'src/carrito/entities/carrito-item.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { SaldoPuntos } from 'src/puntos/entities/saldo-puntos.entity';
import { MovimientoPuntos } from 'src/puntos/entities/movimiento-puntos.entity';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>> & { create?: jest.Mock };

describe('OrdenesService', () => {
  let service: OrdenesService;
  let carritoRepo: MockRepo<Carrito>;
  let productoRepo: MockRepo<Producto>;
  let ordenRepo: MockRepo<Orden>;
  let itemRepo: MockRepo<OrdenItem>;
  let ds: { createQueryRunner: jest.Mock };

  beforeEach(async () => {
    carritoRepo = { findOne: jest.fn() } as any;
    productoRepo = { update: jest.fn() } as any;
    ordenRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn() } as any;
    itemRepo = { create: jest.fn() } as any;

    const qr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: { save: jest.fn(), update: jest.fn(), delete: jest.fn() },
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    ds = { createQueryRunner: jest.fn().mockReturnValue(qr) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdenesService,
        { provide: DataSource, useValue: ds },
        { provide: getRepositoryToken(Orden), useValue: ordenRepo },
        { provide: getRepositoryToken(OrdenItem), useValue: itemRepo },
        { provide: getRepositoryToken(Carrito), useValue: carritoRepo },
        { provide: getRepositoryToken(CarritoItem), useValue: {} },
        { provide: getRepositoryToken(Producto), useValue: productoRepo },
        { provide: getRepositoryToken(SaldoPuntos), useValue: { findOne: jest.fn(), save: jest.fn(), create: jest.fn() } as any },
        { provide: getRepositoryToken(MovimientoPuntos), useValue: { save: jest.fn(), create: jest.fn() } as any },
        { provide: ConfiguracionService, useValue: { getCopPorPunto: jest.fn().mockResolvedValue(1) } },
      ],
    }).compile();

    service = module.get(OrdenesService);
  });

  /** Debe fallar si el carrito está vacío. */
  it('falla si carrito vacío', async () => {
    carritoRepo.findOne!.mockResolvedValue({ userId: 'u1', items: [] });
    await expect(service.checkout('u1', ModoPago.DINERO)).rejects.toThrow('El carrito está vacío');
  });

  /** Crea la orden cuando hay stock suficiente y calcula total. */
  it('crea orden cuando hay stock suficiente', async () => {
    const prod = { id: 'p1', title: 'X', stock: 5, points: 10 } as any;
    carritoRepo.findOne!.mockResolvedValue({ id: 'c1', userId: 'u1', items: [{ producto: prod, cantidad: 2 }] });
    ordenRepo.create!.mockImplementation((o) => o);
    itemRepo.create!.mockImplementation((o) => o);

    const orden = await service.checkout('u1', ModoPago.DINERO);
    expect(orden.totalPoints).toBe(20);
  });

  /** Debe fallar si alguna línea excede el stock disponible. */
  it('falla si una línea excede stock', async () => {
    const prod = { id: 'p1', title: 'Prod', stock: 1, points: 10 } as any;
    carritoRepo.findOne!.mockResolvedValue({ id: 'c1', userId: 'u1', items: [{ producto: prod, cantidad: 3 }] });
    await expect(service.checkout('u1', ModoPago.DINERO)).rejects.toThrow('Stock insuficiente para Prod');
  });

  /** Devuelve órdenes por usuario. */
  it('findByUser retorna listado', async () => {
    (ordenRepo.find as jest.Mock).mockResolvedValue([{ id: 'o1' }]);
    const res = await service.findByUser('u1');
    expect(ordenRepo.find).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(res).toHaveLength(1);
  });

  /** Al fallar persistencia, se hace rollback de la transacción. */
  it('rollback en error durante checkout', async () => {
    const prod = { id: 'p1', title: 'X', stock: 5, points: 10 } as any;
    const qr = ds.createQueryRunner();
    qr.manager.save.mockRejectedValue(new Error('save error'));
    carritoRepo.findOne!.mockResolvedValue({ id: 'c1', userId: 'u1', items: [{ producto: prod, cantidad: 1 }] });
    ordenRepo.create!.mockImplementation((o) => o);
    itemRepo.create!.mockImplementation((o) => o);

    await expect(service.checkout('u1', ModoPago.DINERO)).rejects.toThrow('save error');
    expect(qr.rollbackTransaction).toHaveBeenCalled();
    expect(qr.release).toHaveBeenCalled();
  });
});
