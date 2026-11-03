import express, { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import type { GameWorld } from '../engine/GameWorld.js';
import { COIN_PACKAGES, CURRENCY, grantPurchase, packageById } from '../engine/cyberCoins.js';

/**
 * CyberCoins shop on Stripe Checkout (hosted page: card data never touches this
 * server). Coins are credited when the session is paid, by the webhook and by
 * the /verify call the browser makes when it comes back. Both paths share the
 * same idempotent fulfillment, keyed by the Checkout session id.
 */

interface PaidSession {
  id: string;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string> | null;
}

/** Credits a paid session once. Returns what happened. */
export function fulfillSession(gameWorld: GameWorld, session: PaidSession): { status: 'credited' | 'already' | 'unpaid' | 'invalid'; coins?: number; userId?: string } {
  if (session.payment_status !== 'paid') return { status: 'unpaid' };
  const pack = packageById(session.metadata?.packageId);
  const userId = session.metadata?.userId;
  // The amount must match our catalog, so a tampered session cannot mint coins.
  if (!pack || !userId || session.amount_total !== pack.priceCents || (session.currency || '').toLowerCase() !== CURRENCY) return { status: 'invalid' };
  const player = gameWorld.getPlayer(userId);
  if (!grantPurchase(player, session.id, pack.coins)) return { status: 'already', userId };
  gameWorld.savePlayerState(userId);
  gameWorld.emitTo(userId, 'player_update', { player });
  gameWorld.emitTo(userId, 'hunt_notice', { tone: 'success', title: 'CyberCoins recebidas', message: `+${pack.coins} CyberCoins na sua conta.` });
  return { status: 'credited', coins: pack.coins, userId };
}

let stripeClient: Stripe | null = null;
const stripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return (stripeClient ||= new Stripe(key));
};

/** Webhook route: needs the raw body, so it must be mounted before express.json(). */
export function createStripeWebhookRouter(gameWorld: GameWorld): Router {
  const router = Router();
  router.post('/', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
    const client = stripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!client || !secret) return res.status(503).send('Pagamentos desativados.');
    let event: Stripe.Event;
    try {
      event = client.webhooks.constructEvent(req.body, req.headers['stripe-signature'] as string, secret);
    } catch {
      return res.status(400).send('Assinatura inválida.');
    }
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      try { fulfillSession(gameWorld, event.data.object as Stripe.Checkout.Session); } catch (e) { console.error('[stripe]', e); return res.status(500).send('erro'); }
    }
    res.json({ received: true });
  });
  return router;
}

export function createShopRouter(gameWorld: GameWorld): Router {
  const router = Router();

  const auth = (req: Request, res: Response, next: NextFunction) => {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      (req as any).userId = decoded.userId;
      next();
    } catch {
      res.status(401).json({ error: 'Sessão inválida.' });
    }
  };

  router.get('/packages', (_req, res) => {
    res.json({ enabled: !!stripe(), currency: CURRENCY, packages: COIN_PACKAGES });
  });

  router.post('/checkout', auth, async (req: Request, res: Response) => {
    const client = stripe();
    if (!client) return res.status(503).json({ error: 'Pagamentos ainda não estão ativos.' });
    const pack = packageById(req.body?.packageId);
    if (!pack) return res.status(400).json({ error: 'Pacote inválido.' });
    const userId = (req as any).userId as string;
    const base = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    try {
      const session = await client.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: userId,
        metadata: { userId, packageId: pack.id },
        line_items: [{
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: pack.priceCents,
            product_data: { name: `${pack.coins} CyberCoins · ${pack.label}`, description: 'Moeda virtual do HackerWars. Não reembolsável depois de usada.' },
          },
        }],
        success_url: `${base}/?cc=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/?cc=cancel`,
      });
      res.json({ url: session.url });
    } catch (e) {
      console.error('[stripe] checkout', e);
      res.status(502).json({ error: 'Não foi possível abrir o pagamento. Tente de novo.' });
    }
  });

  // The browser asks this after returning from Checkout, so coins show up even before the webhook arrives.
  router.get('/verify', auth, async (req: Request, res: Response) => {
    const client = stripe();
    if (!client) return res.status(503).json({ error: 'Pagamentos ainda não estão ativos.' });
    const id = String(req.query.session_id || '');
    if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return res.status(400).json({ error: 'Sessão inválida.' });
    try {
      const session = await client.checkout.sessions.retrieve(id);
      if (session.metadata?.userId !== (req as any).userId) return res.status(403).json({ error: 'Essa compra é de outra conta.' });
      const result = fulfillSession(gameWorld, session);
      res.json({ ...result, player: gameWorld.getPlayer((req as any).userId) });
    } catch (e) {
      console.error('[stripe] verify', e);
      res.status(502).json({ error: 'Não foi possível confirmar o pagamento.' });
    }
  });

  return router;
}
