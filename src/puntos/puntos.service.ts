import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import { SaldoPuntos } from './entities/saldo-puntos.entity';
import { MovimientoPuntos } from './entities/movimiento-puntos.entity';

/**
 * Servicio de puntos: consulta de saldo, movimientos y ajustes (crédito/débito).
 */
@Injectable()
export class PuntosService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SaldoPuntos) private readonly saldoRepo: Repository<SaldoPuntos>,
    @InjectRepository(MovimientoPuntos) private readonly movRepo: Repository<MovimientoPuntos>,
  ) {}

  /** Obtiene el saldo actual de un usuario. */
  async getSaldo(userId: string) {
    const saldo = await this.saldoRepo.findOne({ where: { userId } });
    return { userId, saldo: saldo?.saldo ?? 0 };
  }

  /** Lista movimientos de puntos del usuario en orden descendente por fecha. */
  async getMovimientos(userId: string, limit = 10, offset = 0) {
    return this.movRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: limit, skip: offset });
  }

  /**
   * Acredita (suma) puntos al usuario de forma atómica e inserta un movimiento.
   * Falla si `cantidad` no es entero positivo.
   */
  async credit(userId: string, cantidad: number, concepto?: string, ordenId?: string) {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser un entero positivo');
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.manager
        .createQueryBuilder()
        .insert()
        .into(SaldoPuntos)
        .values({ userId, saldo: 0 })
        .orIgnore()
        .execute();

      await qr.manager.increment(SaldoPuntos, { userId }, 'saldo', cantidad);

      const mov = qr.manager.create(MovimientoPuntos, { userId, tipo: 'credito', cantidad, ordenId: ordenId ?? null, concepto });
      await qr.manager.save(mov);

      await qr.commitTransaction();
      const nuevo = await this.saldoRepo.findOne({ where: { userId } });
      return { userId, saldo: nuevo?.saldo ?? 0 };
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  /**
   * Debita (resta) puntos del usuario de forma atómica si el saldo alcanza.
   * Lanza BadRequest con code `SALDO_INSUFICIENTE` cuando no alcanza.
   */
  async debit(userId: string, cantidad: number, concepto?: string, ordenId?: string) {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser un entero positivo');
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.manager
        .createQueryBuilder()
        .insert()
        .into(SaldoPuntos)
        .values({ userId, saldo: 0 })
        .orIgnore()
        .execute();

      const res = await qr.manager.decrement(
        SaldoPuntos,
        { userId, saldo: MoreThanOrEqual(cantidad) },
        'saldo',
        cantidad,
      );
      if (!res.affected) throw new BadRequestException('Saldo de puntos insuficiente');

      const mov = qr.manager.create(MovimientoPuntos, { userId, tipo: 'debito', cantidad, ordenId: ordenId ?? null, concepto });
      await qr.manager.save(mov);

      await qr.commitTransaction();
      const nuevo = await this.saldoRepo.findOne({ where: { userId } });
      return { userId, saldo: nuevo?.saldo ?? 0 };
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }
}

