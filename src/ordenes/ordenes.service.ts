import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Orden, ModoPago } from "./entities/orden.entity";
import { OrdenItem } from "./entities/orden-item.entity";
import { Carrito } from "src/carrito/entities/carrito.entity";
import { CarritoItem } from "src/carrito/entities/carrito-item.entity";
import { Producto } from "src/productos/entities/producto.entity";
import { EstadoOrden } from "./enums/estado-orden.enum";
import { ConfiguracionService } from "src/configuracion/configuracion.service";
import { SaldoPuntos } from "src/puntos/entities/saldo-puntos.entity";
import { MovimientoPuntos } from "src/puntos/entities/movimiento-puntos.entity";

/**
 * Servicio de órdenes: creación y consulta básica.
 */
@Injectable()
export class OrdenesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Orden) private readonly ordenRepo: Repository<Orden>,
    @InjectRepository(OrdenItem) private readonly itemRepo: Repository<OrdenItem>,
    @InjectRepository(Carrito) private readonly carritoRepo: Repository<Carrito>,
    @InjectRepository(CarritoItem) private readonly carritoItemRepo: Repository<CarritoItem>,
    @InjectRepository(Producto) private readonly productoRepo: Repository<Producto>,
    @InjectRepository(SaldoPuntos) private readonly saldoRepo: Repository<SaldoPuntos>,
    @InjectRepository(MovimientoPuntos) private readonly movRepo: Repository<MovimientoPuntos>,
    private readonly configService: ConfiguracionService,
  ) {}

  /** Obtiene órdenes por usuario. */
  async findByUser(userId: string) {
    return this.ordenRepo.find({ where: { userId } });
  }

  /** Crea una orden desde el carrito del usuario (checkout). */
  async checkout(userId: string, modoPago: ModoPago = ModoPago.PUNTOS) {
    const carrito = await this.carritoRepo.findOne({ where: { userId }, relations: { items: { producto: true } } });
    if (!carrito || !carrito.items || carrito.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // Validaciones y cálculo de total (puntos)
    let total = 0;
    for (const it of carrito.items) {
      if (it.cantidad > it.producto.stock) {
        throw new BadRequestException(`Stock insuficiente para ${it.producto.title}`);
      }
      total += it.producto.points * it.cantidad;
    }

    // Transacción
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      if (modoPago === ModoPago.PUNTOS) {
        // Pagar con puntos: verificar saldo, debitar, descontar stock y limpiar carrito
        const orden = this.ordenRepo.create({ userId, totalPoints: total, estado: EstadoOrden.PAGADA, modoPago: ModoPago.PUNTOS });
        orden.items = carrito.items.map((ci) => this.itemRepo.create({ producto: ci.producto, cantidad: ci.cantidad, pointsUnit: ci.producto.points }));
        await qr.manager.save(orden);

        // Saldo de puntos
        let saldo = await qr.manager.findOne(SaldoPuntos, { where: { userId } });
        if (!saldo) saldo = qr.manager.create(SaldoPuntos, { userId, saldo: 0 });
        if (saldo.saldo < total) throw new BadRequestException('Saldo de puntos insuficiente');
        saldo.saldo = saldo.saldo - total;
        await qr.manager.save(saldo);
        const mov = qr.manager.create(MovimientoPuntos, { userId, tipo: 'debito', cantidad: total, ordenId: orden.id, concepto: 'Pago con puntos' });
        await qr.manager.save(mov);

        // Descontar stock
        for (const it of carrito.items) {
          await qr.manager.update(Producto, { id: it.producto.id }, { stock: it.producto.stock - it.cantidad });
        }

        // Limpiar carrito
        await qr.manager.delete(CarritoItem, { carrito: { id: carrito.id } as any });

        await qr.commitTransaction();
        return orden;
      } else {
        // Pagar con dinero: calcular COP y crear orden pendiente
        const tasa = await this.configService.getCopPorPunto();
        const totalCop = Math.round(total * tasa);
        const orden = this.ordenRepo.create({ userId, totalPoints: total, totalCop, estado: EstadoOrden.PENDIENTE, modoPago: ModoPago.DINERO });
        orden.items = carrito.items.map((ci) => this.itemRepo.create({ producto: ci.producto, cantidad: ci.cantidad, pointsUnit: ci.producto.points }));
        await qr.manager.save(orden);
        await qr.commitTransaction();
        return orden;
      }
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  /** Confirma el pago de una orden en dinero: descuenta stock y limpia carrito. */
  async confirmarPago(ordenId: string) {
    const orden = await this.ordenRepo.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundException('Orden no encontrada');
    if (orden.modoPago !== ModoPago.DINERO) throw new BadRequestException('La orden no es de pago con dinero');
    if (orden.estado !== EstadoOrden.PENDIENTE) throw new BadRequestException('La orden no está pendiente');

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const full = await qr.manager.findOne(Orden, { where: { id: ordenId }, relations: { items: { producto: true } } as any });
      if (!full) throw new NotFoundException('Orden no encontrada');
      // Validar stock actual
      for (const it of full.items) {
        if (it.cantidad > it.producto.stock) throw new BadRequestException(`Stock insuficiente para ${it.producto.title}`);
      }
      // Descontar stock
      for (const it of full.items) {
        await qr.manager.update(Producto, { id: it.producto.id }, { stock: it.producto.stock - it.cantidad });
      }
      // Limpiar carrito del usuario
      await qr.manager.delete(CarritoItem, { carrito: { userId: full.userId } as any } as any);
      // Actualizar orden
      await qr.manager.update(Orden, { id: ordenId }, { estado: EstadoOrden.PAGADA });
      await qr.commitTransaction();
      return { id: ordenId, estado: EstadoOrden.PAGADA };
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }
}
