import type { Request, Response } from "express";
export declare function createOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getOrders(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getOrderById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateOrderStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=order.controller.d.ts.map