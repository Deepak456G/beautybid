import { Request, Response } from 'express';
import { ProductService } from './product.service';
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid('Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  productUrl: z.string().url('Valid product URL is required'),
  imageUrl: z.string().url('Valid image URL is required'),
});

export class ProductController {
  static async getProductBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const product = await ProductService.getProductBySlug(slug);
      return res.json({ success: true, product });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message || 'Product not found' });
    }
  }

  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await ProductService.getCategories();
      return res.json({ success: true, categories });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createProduct(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const product = await ProductService.createProduct(req.user.id, req.body);
      return res.status(201).json({ success: true, product });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMyProducts(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const products = await ProductService.getBrandProducts(req.user.id);
      return res.json({ success: true, products });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
