import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  try {
    // Token header se lena (Bearer <token>)
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Bearer ke baad token alag karna
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    // Token verify karna
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ success: false, message: "Invalid or expired token" });
      }

      // decoded payload ko req.user me save kar do
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Token verification failed" });
  }
};
