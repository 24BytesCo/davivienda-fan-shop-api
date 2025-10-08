import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

/**
 * Endpoints del carrito de compras.
 */
@ApiTags('Carrito')
@Controller('carrito')
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  /** Obtiene el carrito del usuario. */
  @Get(':userId')
  @ApiParam({ name: 'userId', description: 'UUID del usuario', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiOperation({ summary: 'Obtener carrito por usuario' })
  get(@Param('userId') userId: string) {
    return this.carritoService.getCart(userId);
  }

  /** Agrega ítem al carrito. */
  @Post('items')
  @ApiOperation({ summary: 'Agregar ítem al carrito' })
  add(@Body() dto: AddItemDto) {
    return this.carritoService.addItem(dto);
  }

  /** Actualiza cantidad de un ítem del carrito. */
  @Patch('items')
  @ApiOperation({ summary: 'Actualizar cantidad de un ítem' })
  update(@Body() dto: UpdateItemDto) {
    return this.carritoService.updateItem(dto);
  }

  /** Elimina un ítem del carrito. */
  @Delete('items/:userId/:productoId')
  @ApiOperation({ summary: 'Eliminar un ítem del carrito' })
  remove(@Param('userId') userId: string, @Param('productoId') productoId: string) {
    return this.carritoService.removeItem(userId, productoId);
  }

  /** Limpia el carrito completo. */
  @Delete(':userId')
  @ApiOperation({ summary: 'Limpiar carrito' })
  clear(@Param('userId') userId: string) {
    return this.carritoService.clear(userId);
  }
}

