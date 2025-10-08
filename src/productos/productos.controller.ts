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
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { StandardResponseDto } from 'src/common/dtos/standard-response.dto';
import { Producto } from './entities';

/**
 * Controlador de endpoints para gestión de productos.
 */
@ApiTags('Productos')
@ApiExtraModels(StandardResponseDto, Producto, UpdateProductoDto)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  /**
   * Crea un nuevo producto con imágenes.
   * La petición debe ser de tipo multipart/form-data.
   * @param {CreateProductoDto} createProductoDto - DTO con los datos del producto.
   * @param {Express.Multer.File[]} files - Arreglo de archivos de imagen.
   */
  @Post()
  @UseInterceptors(FilesInterceptor('images')) // 'images' es el `name` del campo para los archivos
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear producto con imágenes' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
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
   * Obtiene una lista de todos los productos.
   */
  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de resultados a devolver', example: 10, minimum: 1 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Elementos a omitir', example: 0, minimum: 0 })
  @ApiOperation({ summary: 'Listar productos' })
  @ApiOkResponse({
    description: 'Listado paginado',
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(Producto) },
            },
          },
        },
      ],
    },
    examples: {
      ejemplo: {
        value: {
          statusCode: 200,
          ok: true,
          message: 'Operación exitosa',
          data: [
            {
              id: '1049907c-856f-4960-942b-00ecc5aabb73',
              title: 'Camisa Polo Oficial Davivienda',
              points: 1500,
              description: 'Camisa polo de alta calidad con el logo bordado, perfecta para cualquier ocasión.',
              slug: 'camisa_polo_oficial_davivienda',
              stock: 50,
              sizes: ['S', 'M', 'L', 'XL'],
              category: 'ropa',
              images: [
                {
                  id: 1,
                  url: 'https://http2.mlstatic.com/D_NQ_NP_899787-MCO73577433249_122023-O.webp',
                  createdAt: '2025-10-08T09:12:22.340Z',
                  deletedAt: null,
                },
                {
                  id: 2,
                  url: 'https://http2.mlstatic.com/D_NQ_NP_673059-MCO73577317549_122023-O.webp',
                  createdAt: '2025-10-08T09:12:22.340Z',
                  deletedAt: null,
                },
              ],
              createdAt: '2025-10-08T09:12:22.340Z',
              deletedAt: null,
            },
          ],
        },
      },
    },
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.productosService.findAll(paginationDto);
  }

  /**
   * Obtiene un producto activo por su ID.
   * @param {string} id - UUID del producto.
   */
  @Get(':termino')
  @ApiParam({ name: 'termino', description: 'UUID, slug o título en mayúsculas/minúsculas', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiOperation({ summary: 'Obtener producto por término (id/slug/título)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        { properties: { data: { $ref: getSchemaPath(Producto) } } },
      ],
    },
    examples: {
      ejemplo: {
        value: {
          statusCode: 200,
          ok: true,
          message: 'Operación exitosa',
          data: {
            id: '1049907c-856f-4960-942b-00ecc5aabb73',
            title: 'Camisa Polo Oficial Davivienda',
            points: 1500,
            description: 'Camisa polo de alta calidad con el logo bordado, perfecta para cualquier ocasión.',
            slug: 'camisa_polo_oficial_davivienda',
            stock: 50,
            sizes: ['S', 'M', 'L', 'XL'],
            category: 'ropa',
            images: [
              {
                id: 1,
                url: 'https://http2.mlstatic.com/D_NQ_NP_899787-MCO73577433249_122023-O.webp',
                createdAt: '2025-10-08T09:12:22.340Z',
                deletedAt: null,
              },
              {
                id: 2,
                url: 'https://http2.mlstatic.com/D_NQ_NP_673059-MCO73577317549_122023-O.webp',
                createdAt: '2025-10-08T09:12:22.340Z',
                deletedAt: null,
              },
            ],
            createdAt: '2025-10-08T09:12:22.340Z',
            deletedAt: null,
          },
        },
      },
    },
  })
  async findOne(@Param('termino') termino: string) {
    return this.productosService.findOne(termino);
  }

  /**
   * Obtiene un producto por ID (incluyendo eliminados).
   * @param {string} id - UUID del producto.
   */
  @Get('deleted/:id')
  @ApiParam({ name: 'id', description: 'UUID del producto', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiOperation({ summary: 'Obtener producto (incluidos eliminados) por ID' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponseDto) },
        { properties: { data: { $ref: getSchemaPath(Producto) } } },
      ],
    },
    examples: {
      ejemplo: {
        value: {
          statusCode: 200,
          ok: true,
          message: 'Operación exitosa',
          data: {
            id: '1049907c-856f-4960-942b-00ecc5aabb73',
            title: 'Camisa Polo Oficial Davivienda',
            points: 1500,
            description: 'Camisa polo de alta calidad con el logo bordado, perfecta para cualquier ocasión.',
            slug: 'camisa_polo_oficial_davivienda',
            stock: 50,
            sizes: ['S', 'M', 'L', 'XL'],
            category: 'ropa',
            images: [
              {
                id: 1,
                url: 'https://http2.mlstatic.com/D_NQ_NP_899787-MCO73577433249_122023-O.webp',
                createdAt: '2025-10-08T09:12:22.340Z',
                deletedAt: null,
              },
              {
                id: 2,
                url: 'https://http2.mlstatic.com/D_NQ_NP_673059-MCO73577317549_122023-O.webp',
                createdAt: '2025-10-08T09:12:22.340Z',
                deletedAt: null,
              },
            ],
            createdAt: '2025-10-08T09:12:22.340Z',
            deletedAt: null,
          },
        },
      },
    },
  })
  async findOneWithDeleted(@Param('id', ParseUUIDPipe) id: string) {
    return this.productosService.findOneWithDeleted(id);
  }

  /**
   * Actualiza un producto por su ID.
   * @param {string} id - UUID del producto.
   * @param {UpdateProductoDto} updateProductoDto - DTO con datos a actualizar.
   */
  @Patch(':id')
  @ApiParam({ name: 'id', description: 'UUID del producto', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiBody({
    description: 'Campos actualizables del producto',
    type: UpdateProductoDto,
    examples: {
      parcial: {
        summary: 'Actualización parcial',
        value: {
          title: 'Camisa Polo Davivienda - Nueva edición',
          points: 1800,
          stock: 25,
          sizes: ['M', 'L'],
        },
      },
      completo: {
        summary: 'Actualización completa',
        value: {
          title: 'Camisa Polo Oficial Davivienda',
          points: 1500,
          description: 'Edición 2025 con bordado premium',
          slug: 'camisa-polo-oficial-davivienda',
          stock: 50,
          category: 'ropa',
          sizes: ['S', 'M', 'L'],
          images: [
            'https://storage.googleapis.com/bucket/imagen1.png',
            'https://storage.googleapis.com/bucket/imagen2.png',
          ],
        },
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
    @Body() updateProductDto: UpdateProductoDto
  ) {
    return this.productosService.update( id, updateProductDto );
  }

  /**
   * Realiza una eliminación lógica de un producto por su ID.
   * @param {string} id - UUID del producto.
   */
  @Delete(':id')
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
