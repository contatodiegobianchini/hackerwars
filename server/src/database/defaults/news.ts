import { GlobalNewsItem } from '../../types/game.js';

export const INITIAL_NEWS: GlobalNewsItem[] = [
  {
    id: 'news-1',
    timestamp: Date.now() - 500000,
    headline: 'FBI investiga vazamento da suposta receita secreta da Cola-Coca na Darknet.',
    category: 'POLICE',
  },
  {
    id: 'news-2',
    timestamp: Date.now() - 200000,
    headline: 'Pear Inc. lança novo PearPhone por 5 rins sem caixa e sem cabo; ações disparam.',
    category: 'ECONOMY',
  },
  {
    id: 'news-3',
    timestamp: Date.now() - 50000,
    headline: 'Foguete da Space-Y é flagrado minerando Bitcoin no espaço sideral.',
    category: 'SYSTEM',
  },
];
