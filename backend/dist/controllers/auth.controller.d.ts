import type { Request, Response } from "express";
export declare function registerUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function loginUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getCurrentUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function logoutUser(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map