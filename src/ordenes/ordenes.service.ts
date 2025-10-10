import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, MoreThanOrEqual } from "typeorm";
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
        throw new BadRequestException({
          message: `Stock insuficiente para ${it.producto.title}`,
          code: 'STOCK_INSUFICIENTE',
          detalle: `Disponible: ${it.producto.stock}, solicitado: ${it.cantidad}`,
          data: { productoId: it.producto.id, disponible: it.producto.stock, solicitado: it.cantidad },
        });
      }
      total += it.producto.points * it.cantidad;
    }

    // Transacción
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      if (modoPago === ModoPago.PUNTOS) {
        // Pagar con puntos con garantías de concurrencia
        const orden = this.ordenRepo.create({ userId, totalPoints: total, estado: EstadoOrden.PAGADA, modoPago: ModoPago.PUNTOS });
        orden.items = carrito.items.map((ci) => this.itemRepo.create({ producto: ci.producto, cantidad: ci.cantidad, pointsUnit: ci.producto.points }));
        await qr.manager.save(orden);

        // Asegurar fila de saldo existe
        await qr.manager
          .createQueryBuilder()
          .insert()
          .into(SaldoPuntos)
          .values({ userId, saldo: 0 })
          .orIgnore()
          .execute();

        // Debitar saldo de forma atómica si alcanza
        const saldoDec = await qr.manager.decrement(
          SaldoPuntos,
          { userId, saldo: MoreThanOrEqual(total) },
          'saldo',
          total,
        );
        if (!saldoDec.affected)
          throw new BadRequestException({
            message: 'Saldo de puntos insuficiente',
            code: 'SALDO_INSUFICIENTE',
            data: { requerido: total },
          });

        const mov = qr.manager.create(MovimientoPuntos, { userId, tipo: 'debito', cantidad: total, ordenId: orden.id, concepto: 'Pago con puntos' });
        await qr.manager.save(mov);

        // Descontar stock de forma atómica por producto
        for (const it of carrito.items) {
          const res = await qr.manager.decrement(
            Producto,
            { id: it.producto.id, stock: MoreThanOrEqual(it.cantidad) },
            'stock',
            it.cantidad,
          );
          if (!res.affected) {
            throw new BadRequestException({
              message: `Stock insuficiente para ${it.producto.title}`,
              code: 'STOCK_INSUFICIENTE',
              detalle: `No fue posible reservar ${it.cantidad} unidades`,
              data: { productoId: it.producto.id, solicitado: it.cantidad },
            });
          }
        }

        // Limpiar carrito eliminando el carrito (onDelete: CASCADE limpia ítems)
        await qr.manager.delete(Carrito, { id: carrito.id });

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
        if (it.cantidad > it.producto.stock)
          throw new BadRequestException({
            message: `Stock insuficiente para ${it.producto.title}`,
            code: 'STOCK_INSUFICIENTE',
            detalle: `Disponible: ${it.producto.stock}, solicitado: ${it.cantidad}`,
            data: { productoId: it.producto.id, disponible: it.producto.stock, solicitado: it.cantidad },
          });
      }
      // Descontar stock de forma atómica
      for (const it of full.items) {
        const res = await qr.manager.decrement(
          Producto,
          { id: it.producto.id, stock: MoreThanOrEqual(it.cantidad) },
          'stock',
          it.cantidad,
        );
        if (!res.affected)
          throw new BadRequestException({
            message: `Stock insuficiente para ${it.producto.title}`,
            code: 'STOCK_INSUFICIENTE',
            detalle: `No fue posible reservar ${it.cantidad} unidades`,
            data: { productoId: it.producto.id, solicitado: it.cantidad },
          });
      }
      // Limpiar carrito del usuario eliminando el carrito (CASCADE limpia ítems)
      await qr.manager.delete(Carrito, { userId: full.userId });
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
