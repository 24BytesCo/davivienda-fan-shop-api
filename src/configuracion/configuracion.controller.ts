import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfiguracionService } from './configuracion.service';

/**
 * Endpoints para configurar la tasa de cambio.
 */
@ApiTags('Configuración')
@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly service: ConfiguracionService) {}

  /** Obtiene la tasa de COP por punto. */
  @Get('tasa')
  @ApiOperation({ summary: 'Obtener tasa COP por punto' })
  getTasa() {
    return this.service.getCopPorPunto();
  }

  /** Actualiza la tasa de COP por punto. */
  @Put('tasa')
  @ApiOperation({ summary: 'Actualizar tasa COP por punto' })
  setTasa(@Body() body: { valor: number }) {
    return this.service.setCopPorPunto(Number(body.valor));
  }
}

