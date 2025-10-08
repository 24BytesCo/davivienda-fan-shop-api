import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto, ProductoImagen } from './entities';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';

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
    @InjectRepository(ProductoImagen)
    private readonly productoImagenRepository: Repository<ProductoImagen>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea un nuevo producto.
   * @param {CreateProductoDto} createProductoDto - DTO para crear el producto.
   * @returns {Promise<string>} El ID del producto creado.
   */
  async create(createProductoDto: CreateProductoDto): Promise<string> {
    const { images = [], ...detallesProducto } = createProductoDto;

    // Creamos el producto con las imágenes asociadas
    const producto = this.productoRepository.create({
      ...detallesProducto,
      images: images.map((image) =>
        this.productoImagenRepository.create({ url: image }),
      ),
    });

    console.log('producto', producto);

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
      relations: { images: true },
    });
  }

  /**
   * Obtiene un producto por su término (UUID, slug o título).
   * @param {string} termino - UUID, slug o título del producto.
   * @returns {Promise<Producto>} El producto encontrado.
   */
  async findOne(termino: string): Promise<Producto> {
    if (!termino) {
      throw new BadRequestException(
        'El término de búsqueda no puede estar vacío',
      );
    }

    // Un solo QueryBuilder para todas las búsquedas
    const queryBuilder = this.productoRepository.createQueryBuilder('producto');

    // Hacemos el JOIN con las imágenes
    queryBuilder.leftJoinAndSelect('producto.images', 'prodImages');

    if (isUUID(termino)) {
      // Búsqueda por UUID
      queryBuilder.where('producto.id = :id', { id: termino });
    } else {
      // Búsqueda por slug o título (insensible a mayúsculas)
      queryBuilder.where(
        'UPPER(producto.title) = :termino OR UPPER(producto.slug) = :termino',
        {
          termino: termino.toUpperCase(),
        },
      );
    }

    // Ejecutamos la consulta
    const producto = await queryBuilder.getOne();

    if (!producto)
      throw new NotFoundException(
        `Producto con término "${termino}" no encontrado`,
      );

    return producto;
  }

  /**
   * Actualiza un producto y sus imágenes.
   * Si se envían nuevas imágenes, reemplaza las anteriores.
   * Si no, mantiene las existentes.
   * Usa transacción para asegurar la integridad.
   * @param id - ID del producto.
   * @param updateProductDto - Datos actualizados.
   * @returns ID del producto actualizado.
   * @throws NotFoundException si no existe el producto.
   */
  async update(id: string, updateProductDto: UpdateProductoDto) {
    const { images, ...productoActualizar } = updateProductDto;

    const producto = await this.productoRepository.preload({
      id,
      ...productoActualizar,
    });

    if (!producto)
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);

    const queryRunner = this.dataSource.createQueryRunner();

    //Connectamos y empezamos la transacción
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        // Eliminar imágenes antiguas
        await queryRunner.manager.delete(ProductoImagen, {
          producto: { id: producto.id },
        });

        // Asignar nuevas imágenes
        producto.images = images.map((image) =>
          this.productoImagenRepository.create({ url: image }),
        );
      } else {
        // Si no se proporcionan imágenes, mantenemos las existentes
        producto.images = await this.productoImagenRepository.findBy({
          producto: { id: producto.id },
        });
      }

      await queryRunner.manager.save(producto);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return producto.id;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Deja el error para que pueda ser manejado por el filtro global
      throw error;
    }
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
    const producto = await this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.images', 'Images')
      .where('producto.id = :id', { id })
      .withDeleted()
      .getOne();

    if (!producto)
      throw new NotFoundException(
        `Producto con ID ${id} no encontrado en el registro total`,
      );

    return producto;
  }
}
