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
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, getSchemaPath, ApiBearerAuth } from '@nestjs/swagger';
import { StandardResponseDto } from 'src/common/dtos/standard-response.dto';
import { Producto } from './entities';
import { AdminGuard } from 'src/auth/guards/admin.guard';

/**
 * Controlador de endpoints para gestión de productos.
 */
@ApiTags('Productos')
@ApiExtraModels(StandardResponseDto, Producto, UpdateProductoDto)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  /**
   * Crear producto con imágenes (multipart/form-data).
  */
  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear producto con imágenes' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Campos del producto y archivos de imagen',
    schema: {
      type: 'object',
      properties: {
        images: { type: 'array', items: { type: 'string', format: 'binary' } },
        title: { type: 'string' },
        points: { type: 'number' },
        description: { type: 'string' },
        slug: { type: 'string' },
        stock: { type: 'integer' },
        category: { type: 'string' },
        sizes: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'points', 'stock', 'category'],
    },
  })
  @ApiCreatedResponse({
    description: 'Producto creado',
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        { properties: { data: { $ref: getSchemaPath(Producto) } } },
      ],
    },
  })
  create(
    @Body() createProductoDto: CreateProductoDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productosService.create(createProductoDto, files);
  }

  /**
   * Listar productos (paginado).
   */
  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({
    description: 'Listado paginado',
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        { properties: { data: { type: 'array', items: { $ref: getSchemaPath(Producto) } } } },
      ],
    },
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.productosService.findAll(paginationDto);
  }

  /**
   * Obtiene un producto (incluidos eliminados) por su ID.
   * @param {string} id - UUID del producto.
   */
  @Get('deleted/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'UUID del producto', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiOperation({ summary: 'Obtener producto (incluidos eliminados) por ID' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        { properties: { data: { $ref: getSchemaPath(Producto) } } },
      ],
    },
  })
  async findOneWithDeleted(@Param('id', ParseUUIDPipe) id: string) {
    return this.productosService.findOneWithDeleted(id);
  }

  /**
   * Obtener producto por término (id/slug/título).
   */
  @Get(':termino')
  @ApiParam({ name: 'termino', description: 'UUID, slug o título', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiOperation({ summary: 'Obtener producto por término' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        { properties: { data: { $ref: getSchemaPath(Producto) } } },
      ],
    },
  })
  async findOne(@Param('termino') termino: string) {
    return this.productosService.findOne(termino);
  }

  /**
   * Actualiza un producto por su ID.
   * @param {string} id - UUID del producto.
   * @param {UpdateProductoDto} updateProductoDto - DTO con datos a actualizar.
  */
  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'UUID del producto', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiBody({
    description: 'Actualizar campos y opcionalmente subir imágenes nuevas',
    schema: {
      type: 'object',
      properties: {
        images: { type: 'array', items: { type: 'string', format: 'binary' } },
        title: { type: 'string' },
        points: { type: 'number' },
        description: { type: 'string' },
        slug: { type: 'string' },
        stock: { type: 'integer' },
        category: { type: 'string' },
        sizes: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiOkResponse({
    description: 'ID del producto actualizado',
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        { properties: { data: { type: 'string', example: 'uuid' } } },
      ],
    },
  })
  update(
    @Param('id', ParseUUIDPipe ) id: string,
    @Body() updateProductDto: UpdateProductoDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productosService.update(id, updateProductDto, files);
  }

  /**
   * Eliminación lógica de un producto por ID.
  */
  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'UUID del producto', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiOperation({ summary: 'Eliminar lógicamente un producto' })
  @ApiOkResponse({
    description: 'ID del producto eliminado',
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        { properties: { data: { type: 'string', example: 'uuid' } } },
      ],
    },
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.productosService.remove(id);
  }
}

