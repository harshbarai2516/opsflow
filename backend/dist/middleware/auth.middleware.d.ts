import type { NextFunction, Request, Response } from "express";
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
interface AuthPayload {
    userId: number;
    role: string;
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function authorize(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=auth.middleware.d.ts.map