import type { NextFunction, Request, Response } from "express";
export declare function authorize(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=role.middleware.d.ts.map