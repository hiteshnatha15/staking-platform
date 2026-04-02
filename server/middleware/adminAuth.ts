import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'fallback-secret';

export interface AdminRequest extends Request {
  adminUser?: string;
}

export function signAdminToken(username: string): string {
  return jwt.sign({ sub: username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
}

export function adminAuth(req: AdminRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { sub: string; role: string };
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.adminUser = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
}
