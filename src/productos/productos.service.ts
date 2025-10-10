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
import { FilesService } from 'src/files/files.service';

// Utilidad local para validar UUID v1-v5
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
const isUUID = (s: string): boolean => UUID_REGEX.test(s);

/**
 * Servicio: CRUD de productos y manejo de imágenes.
 */
@Injectable()
export class ProductosService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(ProductoImagen)
    private readonly productoImagenRepository: Repository<ProductoImagen>,
    private readonly dataSource: DataSource,
    private readonly filesService: FilesService,
  ) {}

  /** Crea un nuevo producto y sube sus imágenes a Firebase. */
  async create(
    createProductoDto: CreateProductoDto,
    files: Express.Multer.File[],
  ): Promise<Producto> {
    let uploadedUrls: string[] = [];
    try {
      // Subir las imágenes a Firebase
      uploadedUrls = await this.filesService.uploadFiles(files);

      // Crear el producto en la base de datos
      const { ...detallesProducto } = createProductoDto;
      const producto = this.productoRepository.create({
        ...detallesProducto,
        images: uploadedUrls.map((url) =>
          this.productoImagenRepository.create({ url }),
        ),
      });

      await this.productoRepository.save(producto);
      return producto;
    } catch (error) {
      // Si algo falla, eliminar las imágenes que ya se subieron
      if (uploadedUrls.length > 0) {
        this.logger.error('Error al crear el producto en BD. Eliminando imágenes subidas...');
        await this.filesService.deleteFiles(uploadedUrls);
      }
      this.logger.error(error);
      throw error;
    }
  }

  /** Obtiene todos los productos paginados. */
  async findAll(paginationDto: PaginationDto): Promise<Producto[]> {
    const { limit = 10, offset = 0 } = paginationDto;
    return await this.productoRepository.find({
      take: limit,
      skip: offset,
      relations: { images: true },
    });
  }

  /** Obtiene un producto por su término (UUID, slug o título). */
  async findOne(termino: string): Promise<Producto> {
    if (!termino) {
      throw new BadRequestException('El término de búsqueda no puede estar vacío');
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
        { termino: termino.toUpperCase() },
      );
    }

    const producto = await queryBuilder.getOne();
    if (!producto)
      throw new NotFoundException(`Producto con término "${termino}" no encontrado`);
    return producto;
  }

  /** Actualiza un producto y sus imágenes. */
  async update(
    id: string,
    updateProductDto: UpdateProductoDto,
    files: Express.Multer.File[],
  ) {
    const { images, ...productoActualizar } = updateProductDto;

    // Obtener el producto actual con sus imágenes
    const existente = await this.productoRepository.findOne({
      where: { id },
      relations: { images: true },
    });
    if (!existente)
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);

    // Pre-cargar cambios de datos básicos
    const producto = await this.productoRepository.preload({
      id,
      ...productoActualizar,
    });
    if (!producto)
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let uploadedUrls: string[] = [];
    const oldImageUrls = (existente.images ?? []).map((i) => i.url);

    try {
      // Si vienen archivos, subimos y reemplazamos imágenes
      if (files && files.length > 0) {
        // Subir nuevas imágenes
        uploadedUrls = await this.filesService.uploadFiles(files);

        // Reemplazar en BD (borramos registros previos y seteamos nuevos)
        await queryRunner.manager.delete(ProductoImagen, { producto: { id: producto.id } });
        producto.images = uploadedUrls.map((url) => this.productoImagenRepository.create({ url }));
      } else if (images && images.length > 0) {
        // Si vienen URLs directamente en el DTO, usamos esas y reemplazamos
        await queryRunner.manager.delete(ProductoImagen, { producto: { id: producto.id } });
        producto.images = images.map((url) => this.productoImagenRepository.create({ url }));
      } else {
        // No se enviaron nuevas imágenes: conservar las existentes
        producto.images = await this.productoImagenRepository.findBy({ producto: { id: producto.id } });
      }

      await queryRunner.manager.save(producto);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      // Limpieza post-commit: si reemplazamos imágenes, eliminar las viejas del storage
      const replacedWithNewFiles = files && files.length > 0;
      const replacedWithUrls = !replacedWithNewFiles && images && images.length > 0;
      if ((replacedWithNewFiles || replacedWithUrls) && oldImageUrls.length > 0) {
        try {
          await this.filesService.deleteFiles(oldImageUrls);
        } catch (e) {
          this.logger.warn('Fallo al eliminar imágenes antiguas del storage');
        }
      }

      return producto.id;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Si falló algo tras subir imágenes nuevas, limpiarlas
      if (uploadedUrls.length > 0) {
        try {
          await this.filesService.deleteFiles(uploadedUrls);
        } catch (e) {
          this.logger.warn('Fallo al limpiar imágenes recién subidas');
        }
      }

      throw error;
    }
  }

  /** Realiza una eliminación lógica de un producto. */
  async remove(id: string) {
    const producto = await this.productoRepository.findOneBy({ id });
    if (!producto)
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    await this.productoRepository.softDelete(id);
    return producto.id;
  }

  /** Obtiene un producto por ID (incluyendo eliminados). */
  async findOneWithDeleted(id: string): Promise<Producto> {
    const producto = await this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.images', 'Images')
      .where('producto.id = :id', { id })
      .withDeleted()
      .getOne();

    if (!producto)
      throw new NotFoundException(`Producto con ID ${id} no encontrado en el registro total`);

    return producto;
  }
}

