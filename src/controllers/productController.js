import { v4 as uuidv4 } from "uuid";
import db from "../config/database.js";
import cache from "../utils/cache.js";

export function getAllProducts(req, res) {
  const { search, category, limit = 10, page = 1 } = req.query;
  const cacheKey = `products_${search || ""}_${category || ""}_${limit}_${page}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return res.status(200).json({ ...cached, cached: true });
  }

  let products = db.get("products").value();

  if (search) {
    products = products.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()),
    );
  }

  if (category) {
    products = products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase(),
    );
  }

  const total = products.length;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const start = (pageNum - 1) * limitNum;
  const paginated = products.slice(start, start + limitNum);

  const response = {
    data: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(total / limitNum),
    },
  };

  cache.set(cacheKey, response);
  return res.status(200).json(response);
}

export function getProductById(req, res) {
  const { id } = req.params;
  const cacheKey = `product_${id}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return res.status(200).json({ data: cached, cached: true });
  }

  const product = db.get("products").find({ id }).value();

  if (!product) {
    return res.status(404).json({
      error: "Not Found",
      message: `Product with id ${id} not found`,
    });
  }

  cache.set(cacheKey, product);
  return res.status(200).json({ data: product });
}

export function createProduct(req, res) {
  const { title, price, description, category, images } = req.body;

  if (
    !title ||
    !price ||
    !category ||
    !images ||
    !Array.isArray(images) ||
    images.length < 1
  ) {
    return res.status(400).json({
      error: "Bad Request",
      message: "title, price, category, and images (minimal 1) are required",
    });
  }

  const now = new Date().toISOString();
  const newProduct = {
    id: uuidv4(),
    title,
    price,
    description: description || "",
    category,
    images,
    created_at: now,
    created_by: req.user.username,
    created_by_id: req.user.id,
    updated_at: now,
    updated_by: req.user.username,
    updated_by_id: req.user.id,
  };

  db.get("products").push(newProduct).write();
  cache.flushAll();

  return res.status(201).json({
    message: "Product created successfully",
    data: newProduct,
  });
}

export function updateProduct(req, res) {
  const { id } = req.params;
  const product = db.get("products").find({ id }).value();

  if (!product) {
    return res.status(404).json({
      error: "Not Found",
      message: `Product with id ${id} not found`,
    });
  }

  const { title, price, description, category, images } = req.body;
  const updatedFields = {
    ...(title && { title }),
    ...(price && { price }),
    ...(description !== undefined && { description }),
    ...(category && { category }),
    ...(images && { images }),
    updated_at: new Date().toISOString(),
    updated_by: req.user.username,
    updated_by_id: req.user.id,
  };

  db.get("products").find({ id }).assign(updatedFields).write();
  cache.flushAll();

  const updatedProduct = db.get("products").find({ id }).value();

  return res.status(200).json({
    message: "Product updated successfully",
    data: updatedProduct,
  });
}

export function deleteProduct(req, res) {
  const { id } = req.params;
  const product = db.get("products").find({ id }).value();

  if (!product) {
    return res.status(404).json({
      error: "Not Found",
      message: `Product with id ${id} not found`,
    });
  }

  db.get("products").remove({ id }).write();
  cache.flushAll();

  return res.status(200).json({
    message: "Product deleted successfully",
  });
}
