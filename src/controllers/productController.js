import { v4 as uuidv4 } from "uuid";
import db from "../config/database.js";
import cache from "../utils/cache.js";

export async function getAllProducts(req, res, next) {
  try {
    const { search, category, limit = 10, page = 1 } = req.query;
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const pageNumber = Math.max(Number(page) || 1, 1);
    const offset = (pageNumber - 1) * limitNumber;
    const cacheKey = `products:${search || ""}:${category || ""}:${limitNumber}:${pageNumber}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached, cached: true });
    }

    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`title ILIKE $${values.length}`);
    }

    if (category) {
      values.push(category);
      conditions.push(`category ILIKE $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const totalResult = await db.query(
      `SELECT COUNT(*) FROM products ${whereClause}`,
      values,
    );

    const productValues = [...values, limitNumber, offset];
    const productsResult = await db.query(
      `SELECT * FROM products
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${productValues.length - 1}
       OFFSET $${productValues.length}`,
      productValues,
    );

    const total = Number(totalResult.rows[0].count);
    const response = {
      data: productsResult.rows,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        total_pages: Math.ceil(total / limitNumber),
      },
    };

    cache.set(cacheKey, response);

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const cacheKey = `product:${id}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.status(200).json({ data: cached, cached: true });
    }

    const result = await db.query("SELECT * FROM products WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    cache.set(cacheKey, result.rows[0]);

    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const { title, price, description = "", category, images } = req.body;

    if (
      !title ||
      !price ||
      !category ||
      !Array.isArray(images) ||
      !images.length
    ) {
      return res.status(400).json({
        error: "Bad Request",
        message: "title, price, category, and images (minimal 1) are required",
      });
    }

    const result = await db.query(
      `INSERT INTO products (
        id, title, price, description, category, images,
        created_by, created_by_id, updated_by, updated_by_id
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $7, $8)
      RETURNING *`,
      [
        uuidv4(),
        title,
        price,
        description,
        category,
        JSON.stringify(images),
        req.user.username,
        req.user.id,
      ],
    );

    cache.flushAll();

    return res.status(201).json({
      message: "Product created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { title, price, description, category, images } = req.body;

    if (images !== undefined && (!Array.isArray(images) || !images.length)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "images must be an array containing at least 1 image",
      });
    }

    const result = await db.query(
      `UPDATE products SET
        title = COALESCE($1, title),
        price = COALESCE($2, price),
        description = COALESCE($3, description),
        category = COALESCE($4, category),
        images = COALESCE($5::jsonb, images),
        updated_at = NOW(),
        updated_by = $6,
        updated_by_id = $7
      WHERE id = $8
      RETURNING *`,
      [
        title ?? null,
        price ?? null,
        description ?? null,
        category ?? null,
        images !== undefined ? JSON.stringify(images) : null,
        req.user.username,
        req.user.id,
        id,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    cache.flushAll();

    return res.status(200).json({
      message: "Product updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const result = await db.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [req.params.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    cache.flushAll();

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
