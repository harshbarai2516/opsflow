import jwt from "jsonwebtoken";
export function authenticate(req, res, next) {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined");
        }
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error("AUTH MIDDLEWARE ERROR:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
}
export function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action",
            });
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map