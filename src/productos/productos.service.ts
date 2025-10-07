import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';

@Injectable()
export class ProductosService {
  //Inyectar el repositorio de Producto
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) {}

  //Crear un nuevo producto
  async create(createProductoDto: CreateProductoDto): Promise<string> {
    try {
      const producto = this.productoRepository.create(createProductoDto);

      // Guardar el producto en la base de datos
      return (await this.productoRepository.save(producto)).id;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error al crear el producto');
    }
  }

  findAll() {
    return `This action returns all productos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} producto`;
  }

  update(id: number, updateProductoDto: UpdateProductoDto) {
    return `This action updates a #${id} producto`;
  }

  remove(id: number) {
    return `This action removes a #${id} producto`;
  }
}
