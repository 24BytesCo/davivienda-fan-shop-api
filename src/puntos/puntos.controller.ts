import { Controller, Get, Param, ParseUUIDPipe, Post, Body, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PuntosService } from './puntos.service';
import { AjustarPuntosDto } from './dto/ajustar-puntos.dto';

@ApiTags('Puntos')
@Controller('puntos')
export class PuntosController {
  constructor(private readonly puntosService: PuntosService) {}

  @Get(':userId')
  @ApiParam({ name: 'userId', description: 'UUID del usuario' })
  @ApiOperation({ summary: 'Consultar saldo de puntos' })
  @ApiOkResponse({ description: 'Saldo actual', schema: { properties: { userId: { type: 'string' }, saldo: { type: 'number' } } } })
  getSaldo(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.puntosService.getSaldo(userId);
  }

  @Get(':userId/movimientos')
  @ApiParam({ name: 'userId', description: 'UUID del usuario' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOperation({ summary: 'Listar movimientos de puntos' })
  getMovimientos(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.puntosService.getMovimientos(userId, Number(limit ?? 10), Number(offset ?? 0));
  }

  @Post(':userId/credit')
  @ApiParam({ name: 'userId', description: 'UUID del usuario' })
  @ApiOperation({ summary: 'Acreditar puntos al usuario' })
  credit(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AjustarPuntosDto,
  ) {
    return this.puntosService.credit(userId, dto.cantidad, dto.concepto, dto.ordenId);
  }

  @Post(':userId/debit')
  @ApiParam({ name: 'userId', description: 'UUID del usuario' })
  @ApiOperation({ summary: 'Debitar puntos del usuario' })
  debit(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AjustarPuntosDto,
  ) {
    return this.puntosService.debit(userId, dto.cantidad, dto.concepto, dto.ordenId);
  }
}

