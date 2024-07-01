import { expressjwt } from "express-jwt";

const jwtMiddleware = expressjwt({
    // audience: process.env.AUDIENCE,
    // issuer: process.env.ISSUER,
    secret: process.env.SECRET_KEY,
    algorithms: ["HS256"],
}).unless({ path: ["/login", '/sign-up', '/verify-code', '/send-verification-code'] });

export default jwtMiddleware;