import { prisma } from "../lib/prisma.js";
/* =========================
   GET ALL PRODUCTS
========================= */
export async function getProducts(_req, res) {
    try {
        const products = await prisma.product.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json({
            success: true,
            data: products,
        });
    }
    catch (error) {
        console.error("GET PRODUCTS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
        });
    }
}
/* =========================
   CREATE PRODUCT
========================= */
export async function createProduct(req, res) {
    try {
        const { name, sku, category, brand, unit, purchasePrice, sellingPrice, currentStock, minimumStock, status, } = req.body;
        if (!name ||
            !sku ||
            !category ||
            !unit ||
            sellingPrice === undefined) {
            return res.status(400).json({
                success: false,
                message: "Name, SKU, category, unit and selling price are required",
            });
        }
        const existingProduct = await prisma.product.findUnique({
            where: {
                sku,
            },
        });
        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: "Product with this SKU already exists",
            });
        }
        const product = await prisma.product.create({
            data: {
                name,
                sku,
                category,
                unit,
                sellingPrice: Number(sellingPrice),
                ...(brand && {
                    brand,
                }),
                ...(purchasePrice !== undefined &&
                    purchasePrice !== null && {
                    purchasePrice: Number(purchasePrice),
                }),
                ...(currentStock !== undefined &&
                    currentStock !== null && {
                    currentStock: Number(currentStock),
                }),
                ...(minimumStock !== undefined &&
                    minimumStock !== null && {
                    minimumStock: Number(minimumStock),
                }),
                ...(status && {
                    status,
                }),
            },
        });
        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    }
    catch (error) {
        console.error("CREATE PRODUCT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create product",
        });
    }
}
/* =========================
   GET PRODUCT BY ID
========================= */
export async function getProductById(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }
        const product = await prisma.product.findUnique({
            where: {
                id,
            },
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: product,
        });
    }
    catch (error) {
        console.error("GET PRODUCT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch product",
        });
    }
}
/* =========================
   UPDATE PRODUCT
========================= */
export async function updateProduct(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }
        const existingProduct = await prisma.product.findUnique({
            where: {
                id,
            },
        });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        const { name, sku, category, brand, unit, purchasePrice, sellingPrice, currentStock, minimumStock, status, } = req.body;
        if (sku && sku !== existingProduct.sku) {
            const skuExists = await prisma.product.findUnique({
                where: {
                    sku,
                },
            });
            if (skuExists) {
                return res.status(409).json({
                    success: false,
                    message: "SKU already belongs to another product",
                });
            }
        }
        const product = await prisma.product.update({
            where: {
                id,
            },
            data: {
                ...(name !== undefined && {
                    name,
                }),
                ...(sku !== undefined && {
                    sku,
                }),
                ...(category !== undefined && {
                    category,
                }),
                ...(brand !== undefined && {
                    brand,
                }),
                ...(unit !== undefined && {
                    unit,
                }),
                ...(purchasePrice !== undefined && {
                    purchasePrice: purchasePrice === null
                        ? null
                        : Number(purchasePrice),
                }),
                ...(sellingPrice !== undefined && {
                    sellingPrice: Number(sellingPrice),
                }),
                ...(currentStock !== undefined && {
                    currentStock: Number(currentStock),
                }),
                ...(minimumStock !== undefined && {
                    minimumStock: Number(minimumStock),
                }),
                ...(status !== undefined && {
                    status,
                }),
            },
        });
        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product,
        });
    }
    catch (error) {
        console.error("UPDATE PRODUCT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update product",
        });
    }
}
/* =========================
   DELETE PRODUCT
========================= */
export async function deleteProduct(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }
        const existingProduct = await prisma.product.findUnique({
            where: {
                id,
            },
        });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        await prisma.product.delete({
            where: {
                id,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        console.error("DELETE PRODUCT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete product",
        });
    }
}
//# sourceMappingURL=product.controller.js.map