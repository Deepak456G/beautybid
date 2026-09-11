import { Router } from 'express';
import { ProductController, createProductSchema } from './product.controller';
import { requireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';

const router = Router();

router.get('/categories/all', ProductController.getCategories);
router.get('/brand/my-products', requireAuth, ProductController.getMyProducts);
router.get('/:slug', ProductController.getProductBySlug);
router.post('/', requireAuth, validateRequest(createProductSchema), ProductController.createProduct);

export default router;
