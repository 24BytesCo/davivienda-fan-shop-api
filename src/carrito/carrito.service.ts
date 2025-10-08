import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrito } from './entities/carrito.entity';
import { CarritoItem } from './entities/carrito-item.entity';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Producto } from 'src/productos/entities/producto.entity';

/**
 * Servicio de gestión del carrito de compras.
 */
@Injectable()
export class CarritoService {
  constructor(
    @InjectRepository(Carrito) private readonly carritoRepo: Repository<Carrito>,
    @InjectRepository(CarritoItem) private readonly itemRepo: Repository<CarritoItem>,
    @InjectRepository(Producto) private readonly productoRepo: Repository<Producto>,
  ) {}

  /** Obtiene o crea el carrito del usuario. */
  private async getOrCreateCart(userId: string): Promise<Carrito> {
    let cart = await this.carritoRepo.findOne({ where: { userId }, relations: { items: true } });
    if (!cart) {
      cart = this.carritoRepo.create({ userId, items: [] });
      cart = await this.carritoRepo.save(cart);
    }
    if (!cart.items) cart.items = [];
    return cart;
  }

  /** Calcula el total de puntos del carrito. */
  private calcularTotal(cart: Carrito) {
    const total = (cart.items || []).reduce((acc, it) => acc + (it.producto?.points ?? 0) * it.cantidad, 0);
    return { totalPoints: total, items: cart.items?.length ?? 0 };
  }

  /** Devuelve el carrito del usuario con totales. */
  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const withProducts = await this.carritoRepo.findOne({ where: { id: cart.id }, relations: { items: { producto: true } } });
    const summary = this.calcularTotal(withProducts!);
    return { ...withProducts!, summary };
  }

  /** Agrega un ítem, validando stock y cantidades. */
  async addItem({ userId, productoId, cantidad }: AddItemDto) {
    if (cantidad <= 0) throw new BadRequestException('La cantidad debe ser positiva');

    const cart = await this.getOrCreateCart(userId);
    const producto = await this.productoRepo.findOne({ where: { id: productoId } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    // Busca si ya existe el ítem
    let item = (await this.itemRepo.find({ where: { carrito: { id: cart.id } }, relations: { producto: true, carrito: true } }))
      .find((i) => i.producto.id === productoId);

    const requested = (item?.cantidad ?? 0) + cantidad;
    if (requested > producto.stock) throw new BadRequestException('Stock insuficiente');

    if (!item) {
      item = this.itemRepo.create({ carrito: cart, producto, cantidad });
    } else {
      item.cantidad = requested;
    }

    await this.itemRepo.save(item);
    return this.getCart(userId);
  }

  /** Actualiza la cantidad de un ítem específico. */
  async updateItem({ userId, productoId, cantidad }: UpdateItemDto) {
    if (cantidad <= 0) throw new BadRequestException('La cantidad debe ser positiva');
    const cart = await this.getOrCreateCart(userId);

    const item = (await this.itemRepo.find({ where: { carrito: { id: cart.id } }, relations: { producto: true, carrito: true } }))
      .find((i) => i.producto.id === productoId);
    if (!item) throw new NotFoundException('Ítem no encontrado en el carrito');

    if (cantidad > item.producto.stock) throw new BadRequestException('Stock insuficiente');
    item.cantidad = cantidad;
    await this.itemRepo.save(item);
    return this.getCart(userId);
  }

  /** Elimina un ítem del carrito. */
  async removeItem(userId: string, productoId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = (await this.itemRepo.find({ where: { carrito: { id: cart.id } }, relations: { producto: true } }))
      .find((i) => i.producto.id === productoId);
    if (!item) return this.getCart(userId);
    await this.itemRepo.delete(item.id);
    return this.getCart(userId);
  }

  /** Limpia todos los ítems del carrito. */
  async clear(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.itemRepo.delete({ carrito: { id: cart.id } as any });
    return this.getCart(userId);
  }
}

