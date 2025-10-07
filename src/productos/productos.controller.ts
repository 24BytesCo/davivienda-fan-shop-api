import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  /**
   * Crea un nuevo producto.
   * @param {CreateProductoDto} createProductoDto - DTO para la creación.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  /**
   * Obtiene una lista de todos los productos.
   */
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.productosService.findAll(paginationDto);
  }

  /**
   * Obtiene un producto activo por su ID.
   * @param {string} id - UUID del producto.
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productosService.findOne(id);
  }

  /**
   * Obtiene un producto por ID (incluyendo eliminados).
   * @param {string} id - UUID del producto.
   */
  @Get('deleted/:id')
  async findOneWithDeleted(@Param('id', ParseUUIDPipe) id: string) {
    return this.productosService.findOneWithDeleted(id);
  }

  /**
   * Actualiza un producto por su ID.
   * @param {string} id - UUID del producto.
   * @param {UpdateProductoDto} updateProductoDto - DTO con datos a actualizar.
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, updateProductoDto);
  }

  /**
   * Realiza una eliminación lógica de un producto por su ID.
   * @param {string} id - UUID del producto.
   */
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.productosService.remove(id);
  }
}