import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfiguracionService } from './configuracion.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';

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
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar tasa COP por punto' })
  setTasa(@Body() body: { valor: number }) {
    return this.service.setCopPorPunto(Number(body.valor));
  }
}

