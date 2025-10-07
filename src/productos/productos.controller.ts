import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // Crear un nuevo producto
  @Post()
  async create(@Body() createProductoDto: CreateProductoDto) {
    return await this.productosService.create(createProductoDto);
  }

  // Obtener todos los productos
  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  // Obtener un producto por su ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productosService.findOne(+id);
  }

  // Actualizar un producto por su ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductoDto: UpdateProductoDto) {
    return this.productosService.update(+id, updateProductoDto);
  }

  // Eliminar un producto por su ID
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productosService.remove(+id);
  }
}
