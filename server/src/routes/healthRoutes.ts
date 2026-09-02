import { Router } from 'express';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    return res.json({ status: 'online', db: 'supabase', timestamp: Date.now() });
  });

  return router;
}
