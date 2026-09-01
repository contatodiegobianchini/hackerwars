import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbHelpers } from '../database/supabase.js';
import { GameWorld } from '../engine/GameWorld.js';

const ADMIN_USERNAME = 'diegodev';

export function createAuthRouter(gameWorld: GameWorld): Router {
  const router = Router();

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de autenticação. Tente novamente mais tarde.' },
  });

  const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido ou inválido' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; username: string; role?: string };
      (req as any).user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: 'Sessão expirada ou inválida' });
    }
  };

  router.post('/register', authLimiter, (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
    }
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return res.status(400).json({ error: 'O nome de usuário deve ter entre 3 e 20 caracteres.' });
    }
    if (password.length < 12) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 12 caracteres.' });
    }
    if (cleanUsername === ADMIN_USERNAME) {
      return res.status(409).json({ error: 'Este nome de usuário é reservado.' });
    }
    if (dbHelpers.getUserByUsername(cleanUsername)) {
      return res.status(409).json({ error: 'Este nome de usuário já está em uso na rede.' });
    }

    const hash = bcrypt.hashSync(password, 12);
    const { userId, player } = dbHelpers.createUser(cleanUsername, hash);
    const token = jwt.sign(
      { userId, username: cleanUsername, role: 'player' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
    gameWorld.addNews(`Novo hacker registrou-se na rede: ${cleanUsername} (${player.ip})`, 'SYSTEM');
    return res.json({ token, user: { id: userId, username: cleanUsername, role: 'player' }, player });
  });

  router.post('/login', authLimiter, (req: Request, res: Response) => {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Informe usuário e senha.' });
    }
    const cleanUsername = username.trim().toLowerCase();

    const user = dbHelpers.getUserByUsername(cleanUsername);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });
    if (user.is_banned) {
      return res.status(403).json({ error: `CONTA BANIDA: ${user.ban_reason || 'Violação das regras do jogo.'}` });
    }

    const passwordMatches = cleanUsername === ADMIN_USERNAME && ADMIN_PASSWORD
      ? password === ADMIN_PASSWORD
      : bcrypt.compareSync(password, user.password_hash);

    if (!passwordMatches) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const player = gameWorld.getPlayer(user.id);
    player.role = cleanUsername === ADMIN_USERNAME ? 'admin' : (user.role || 'player');
    player.isBanned = false;
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: player.role },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
    return res.json({ token, user: { id: user.id, username: user.username, role: player.role }, player });
  });

  router.get('/me', verifyToken, (req: Request, res: Response) => {
    const decoded = (req as any).user;
    const player = gameWorld.getPlayer(decoded.userId);
    return res.json({ user: { id: decoded.userId, username: decoded.username, role: player.role }, player });
  });

  return router;
}
