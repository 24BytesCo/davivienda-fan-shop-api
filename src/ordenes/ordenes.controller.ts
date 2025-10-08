import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { ModoPago } from './entities/orden.entity';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

/**
 * Endpoints para gestión de órdenes y checkout.
 */
@ApiTags('Órdenes')
@Controller('ordenes')
export class OrdenesController {
  constructor(private readonly ordenesService: OrdenesService) {}

  /** Obtiene órdenes por usuario. */
  @Get('usuario/:userId')
  @ApiParam({ name: 'userId', description: 'UUID del usuario' })
  @ApiOperation({ summary: 'Listar órdenes del usuario' })
  findByUser(@Param('userId') userId: string) {
    return this.ordenesService.findByUser(userId);
  }

  /** Realiza checkout del carrito. */
  @Post('checkout/:userId')
  @ApiParam({ name: 'userId', description: 'UUID del usuario' })
  @ApiOperation({ summary: 'Checkout del carrito' })
  checkout(@Param('userId') userId: string, @Body() body: { modoPago: ModoPago }) {
    return this.ordenesService.checkout(userId, body?.modoPago ?? ModoPago.PUNTOS);
  }

  /** Confirma el pago de una orden en dinero. */
  @Post(':id/confirmar-pago')
  @ApiParam({ name: 'id', description: 'UUID de la orden' })
  @ApiOperation({ summary: 'Confirmar pago (dinero)' })
  confirmar(@Param('id') id: string) {
    return this.ordenesService.confirmarPago(id);
  }
}
