import type { Request, Response } from "express";
/**
 * Create an inventory transaction
 *
 * PURCHASE   -> increases stock
 * RETURN     -> increases stock
 * ADJUSTMENT -> increases stock
 * SALE       -> decreases stock
 * DAMAGE     -> decreases stock
 */
export declare function createInventoryTransaction(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get all inventory transactions
 */
export declare function getInventoryTransactions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get inventory history for a specific product
 */
export declare function getProductInventoryHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=inventory.controller.d.ts.map