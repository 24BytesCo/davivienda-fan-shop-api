import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracion } from './entities/configuracion.entity';

/**
 * Servicio para leer y actualizar la configuración del sistema.
 */
@Injectable()
export class ConfiguracionService {
  static readonly CLAVE_COP_POR_PUNTO = 'COP_POR_PUNTO';

  constructor(@InjectRepository(Configuracion) private readonly repo: Repository<Configuracion>) {}

  /** Obtiene la tasa actual de COP por punto. */
  async getCopPorPunto(): Promise<number> {
    const row = await this.repo.findOne({ where: { clave: ConfiguracionService.CLAVE_COP_POR_PUNTO } });
    if (!row) throw new BadRequestException('Tasa de cambio no configurada');
    if (row.valorNumero <= 0) throw new BadRequestException('Tasa de cambio inválida');
    return row.valorNumero;
  }

  /** Define la tasa de COP por punto. */
  async setCopPorPunto(valor: number) {
    if (valor <= 0) throw new BadRequestException('La tasa debe ser positiva');
    let row = await this.repo.findOne({ where: { clave: ConfiguracionService.CLAVE_COP_POR_PUNTO } });
    if (!row) row = this.repo.create({ clave: ConfiguracionService.CLAVE_COP_POR_PUNTO, valorNumero: valor });
    else row.valorNumero = valor;
    return this.repo.save(row);
  }
}

