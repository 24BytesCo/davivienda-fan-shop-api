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
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.productosService.findAll(paginationDto);
  }

  /**
   * Obtiene un producto activo por su ID.
   * @param {string} id - UUID del producto.
   */
  @Get(':termino')
  async findOne(@Param('termino') termino: string) {
    return this.productosService.findOne(termino);
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
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.productosService.remove(id);
  }
}