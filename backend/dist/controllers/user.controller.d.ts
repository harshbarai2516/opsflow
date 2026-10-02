import type { Request, Response } from "express";
export declare function getUsers(_req: Request, res: Response): Promise<void>;
export declare function getUserById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateUser(req: Request, res: Response): Promise<void>;
export declare function deleteUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=user.controller.d.ts.map