import express from "express";
import * as productController from "../controllers/productController.js";
import { authenticate } from "../middleware/auth.js";
import { productMutationLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post(
  "/",
  authenticate,
  productMutationLimiter,
  productController.createProduct,
);
router.put(
  "/:id",
  authenticate,
  productMutationLimiter,
  productController.updateProduct,
);
router.delete(
  "/:id",
  authenticate,
  productMutationLimiter,
  productController.deleteProduct,
);

export default router;
