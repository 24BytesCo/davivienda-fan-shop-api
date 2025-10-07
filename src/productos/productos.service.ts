import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import e from 'express';

@Injectable()
export class ProductosService {
  private readonly logger = new Logger('ProductsService');

  /**
   * Inyecta el repositorio de la entidad Producto.
   * @param {Repository<Producto>} productoRepository - Repositorio de TypeORM.
   */
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) {}

  /**
   * Crea un nuevo producto.
   * @param {CreateProductoDto} createProductoDto - DTO para crear el producto.
   * @returns {Promise<string>} El ID del producto creado.
   */
  async create(createProductoDto: CreateProductoDto): Promise<string> {
    const producto = this.productoRepository.create(createProductoDto);
    await this.productoRepository.save(producto);
    return producto.id;
  }

  /**
   * Obtiene todos los productos paginados.
   * @returns {Promise<Producto[]>} Un arreglo de productos.
   */
  async findAll(paginationDto: PaginationDto): Promise<Producto[]> {
    const { limit = 10, offset = 0 } = paginationDto;
    return await this.productoRepository.find({
      take: limit,
      skip: offset,
    });
  }

  /**
   * Obtiene un producto por su ID (solo activos).
   * @param {string} id - UUID del producto.
   * @returns {Promise<Producto>} El producto encontrado.
   */
  async findOne(id: string): Promise<Producto> {
    const producto = await this.productoRepository.findOneBy({ id });
    if (!producto)
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    return producto;
  }

  /**
   * Actualiza un producto por su ID.
   * @param {string} id - UUID del producto a actualizar.
   * @param {UpdateProductoDto} updateProductoDto - DTO con los datos a actualizar.
   * @returns {Promise<string>} El ID del producto actualizado.
   */
  async update(
    id: string,
    updateProductoDto: UpdateProductoDto,
  ): Promise<string> {
    const producto = await this.productoRepository.findOneBy({ id });
    if (!producto)
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);

    // Actualiza las propiedades del producto
    Object.assign(producto, updateProductoDto);
    await this.productoRepository.save(producto);
    return producto.id;
  }

  /**
   * Realiza una eliminación lógica de un producto.
   * @param {string} id - UUID del producto a eliminar.
   */
  async remove(id: string) {
    const producto = await this.productoRepository.findOneBy({ id });

    if (!producto)
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);

    await this.productoRepository.softDelete(id);

    return producto.id;
  }

  /**
   * Obtiene un producto por ID (incluyendo eliminados).
   * @param {string} id - UUID del producto.
   * @returns {Promise<Producto>} El producto encontrado.
   */
  async findOneWithDeleted(id: string): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id },
      withDeleted: true, // Incluye registros con soft-delete
    });

    if (!producto)
      throw new NotFoundException(
        `Producto con ID ${id} no encontrado en el registro total`,
      );

    return producto;
  }
}
