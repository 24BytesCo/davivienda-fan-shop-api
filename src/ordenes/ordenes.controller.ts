import { Body, Controller, Get, Param, Post, UseGuards, Req } from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { ModoPago } from './entities/orden.entity';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { UserOrAdminGuard } from 'src/auth/guards/user-or-admin.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';

/**
 * Endpoints para gestión de órdenes y checkout.
 */
@ApiTags('Órdenes')
@Controller('ordenes')
export class OrdenesController {
  constructor(private readonly ordenesService: OrdenesService) {}

  /** Obtiene órdenes por usuario. */
  @Get('usuario/:userId')
  @UseGuards(JwtGuard, UserOrAdminGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: 'UUID del usuario' })
  @ApiOperation({ summary: 'Listar órdenes del usuario' })
  findByUser(@Param('userId') userId: string) {
    return this.ordenesService.findByUser(userId);
  }

  /** Listar órdenes del usuario autenticado (token). */
  @Get('mis-ordenes')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar mis órdenes (requiere token)' })
  findMyOrders(@Req() req: any) {
    const userId = req.user?.sub as string;
    return this.ordenesService.findByUser(userId);
    
  }

  /** Realiza checkout del carrito. */
  @Post('checkout/:userId')
  @UseGuards(JwtGuard, UserOrAdminGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: 'UUID del usuario' })
  @ApiOperation({ summary: 'Checkout del carrito' })
  checkout(@Param('userId') userId: string, @Body() body: { modoPago: ModoPago }) {
    return this.ordenesService.checkout(userId, body?.modoPago ?? ModoPago.PUNTOS);
  }

  /** Confirma el pago de una orden en dinero. */
  @Post(':id/confirmar-pago')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'UUID de la orden' })
  @ApiOperation({ summary: 'Confirmar pago (dinero)' })
  confirmar(@Param('id') id: string) {
    return this.ordenesService.confirmarPago(id);
  }
}

