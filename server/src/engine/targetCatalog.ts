import { v4 as uuidv4 } from 'uuid';
import type { VirtualServer } from '../types/game.js';
import { seededRng, type Rng } from './contractBoard.js';

/**
 * Catalog of scannable targets. Most of the old pool was corporate, bank and
 * government (Hasher 6+), so scans handed beginners targets they could not touch.
 * The catalog adds many small and mid-sized targets, and scans now pick a
 * difficulty band around the player's cracker.
 */

export type TargetType = VirtualServer['type'];
export interface TargetTemplate { name: string; domain: string; type: TargetType; desc: string; min: number; max: number; }

const t = (name: string, domain: string, type: TargetType, min: number, max: number, desc: string): TargetTemplate => ({ name, domain, type, min, max, desc });

/** Small targets (Hasher 0.5 to 3): the first rungs of the ladder. */
const LOW: TargetTemplate[] = [
  t('Padaria Pão Quente', 'caixa.paoquente.com.br', 'personal', 0.5, 1.5, 'Caixa da padaria rodando num PC velho com Windows XP.'),
  t('Petshop Au-Miau', 'agenda.aumiau.pet', 'personal', 0.5, 1.5, 'Agenda de banho e tosa com o telefone de todos os tutores.'),
  t('Escola Estadual Machado', 'notas.escola-machado.edu.br', 'university', 0.8, 2, 'Sistema de notas. Os alunos já tentaram invadir 40 vezes.'),
  t('Igreja do Pastor Digital', 'dizimo.pastordigital.org', 'personal', 0.8, 2, 'Controle de dízimos numa planilha compartilhada sem senha.'),
  t('Barbearia do Tonho', 'agenda.barbeariatonho.com', 'personal', 0.5, 1.5, 'Agendamentos e fotos de cortes de cabelo duvidosos.'),
  t('Blog da Tia Cleide', 'receitas.tiacleide.blog', 'personal', 0.5, 1.2, 'Blog de receitas com 12 visitantes e uma senha igual ao nome do gato.'),
  t('Lan House Cyber Total', 'caixa.cybertotal.net', 'personal', 0.8, 2, 'Servidor da lan house com o histórico de tudo que a molecada acessa.'),
  t('Autoescola Pare Aqui', 'provas.pareaqui.com.br', 'personal', 1, 2.2, 'Banco de questões do Detran e o cadastro de alunos.'),
  t('Loja de Games Retrô', 'estoque.retrogames.shop', 'personal', 1, 2.5, 'Estoque de cartuchos raros e preços de custo.'),
  t('Academia Corpo Vivo', 'catraca.corpovivo.fit', 'personal', 1, 2.5, 'Catraca digital com fotos e planos de todos os alunos.'),
  t('Rádio Comunitária FM 87', 'radio.fm87.org', 'personal', 0.8, 2, 'Transmissor da rádio local e a lista de ouvintes premiados.'),
  t('Prefeitura de Cidadezinha', 'protocolo.cidadezinha.gov.br', 'university', 1.5, 3, 'Protocolo de requerimentos que ninguém lê desde 2011.'),
  t('Pousada Sol & Mar', 'reservas.solemar.tur.br', 'personal', 1.2, 2.8, 'Sistema de reservas com dados de cartão guardados em texto puro.'),
  t('Clube de Xadrez Peão Branco', 'ranking.peaobranco.club', 'personal', 0.5, 1.5, 'Ranking de partidas e e-mails dos sócios.'),
];

/** Mid-low targets (Hasher 3 to 8). */
const MID_LOW: TargetTemplate[] = [
  t('Clínica Vida Saudável', 'prontuarios.vidasaudavel.med.br', 'corporate', 3, 6, 'Prontuários eletrônicos com exames de gente famosa.'),
  t('Faculdade Estácio Duvidosa', 'secretaria.estaciod.edu.br', 'university', 3, 6, 'Sistema acadêmico, notas e diplomas que se vendem por aí.'),
  t('Provedor NetRápida', 'radius.netrapida.com.br', 'corporate', 3.5, 7, 'Autenticação de clientes de um provedor regional de fibra.'),
  t('Cartório Registro Fácil', 'certidoes.registrofacil.not.br', 'corporate', 4, 8, 'Certidões e escrituras de imóveis da cidade inteira.'),
  t('Startup Brigadeiro.io', 'api.brigadeiro.io', 'corporate', 3, 7, 'Startup de doces por assinatura queimando dinheiro de investidor.'),
  t('Fórum GameBR', 'db.forum-gamebr.net', 'darkweb', 3, 6.5, 'Fórum de jogos com 200 mil contas e hashes em MD5.'),
  t('Rede de Farmácias Drogavida', 'pdv.drogavida.com.br', 'corporate', 4.5, 8, 'Caixas de 300 lojas e a base de clientes com CPF.'),
  t('Supermercado Preço Bom', 'fidelidade.precobom.com.br', 'corporate', 4, 7.5, 'Programa de fidelidade com histórico de compras.'),
  t('Imobiliária Casa Própria', 'contratos.casapropria.imb.br', 'corporate', 4.5, 8, 'Contratos de aluguel e comprovantes de renda escaneados.'),
  t('Hospital São Lázaro', 'triagem.saolazaro.saude.gov.br', 'government', 5, 8, 'Triagem e leitos. Segurança contratada pelo menor preço.'),
  t('Transportadora Rota 66', 'rastreio.rota66.log.br', 'corporate', 4, 7.5, 'Rastreamento de cargas e rotas dos caminhões.'),
  t('Cervejaria Artesanal Lúpulo', 'pedidos.lupulo.beer', 'corporate', 3, 6, 'Pedidos de atacado e a receita da IPA premiada.'),
  t('Nutricionista Fit Gourmet', 'planos.fitgourmet.app', 'personal', 3, 5.5, 'Planos alimentares de influenciadores que juram que comem salada.'),
  t('Servidor Minecraft Bloquinho', 'whitelist.bloquinho.gg', 'darkweb', 3, 6, 'Servidor pago com doações em PIX e muita intriga entre admins.'),
];

/** Mid targets (Hasher 8 to 15). */
const MID: TargetTemplate[] = [
  t('Banco Cooperativo Vale Verde', 'ib.valeverde.coop.br', 'bank', 8, 13, 'Cooperativa de crédito do interior com cofre bem mais gordo que a segurança.'),
  t('Rede de Hotéis Estrela Dourada', 'reservas.estreladourada.hotel', 'corporate', 8, 13, 'Reservas, passaportes e os hóspedes que ninguém pode saber.'),
  t('Operadora MóvelCel', 'billing.movelcel.tel', 'corporate', 9, 14, 'Faturamento e registros de chamadas de milhões de linhas.'),
  t('Universidade Federal do Nordeste', 'pesquisa.ufne.edu.br', 'university', 8, 12, 'Patentes em andamento e dados de pesquisa financiados pelo CNPq.'),
  t('Construtora Torre Alta', 'obras.torrealta.eng.br', 'corporate', 9, 14, 'Orçamentos de licitações com notas combinadas de antemão.'),
  t('Casa de Câmbio Dólar Paralelo', 'cambio.dolarparalelo.fin', 'bank', 10, 15, 'Câmbio com notas altas e contabilidade criativa.'),
  t('Rede de TV Canal 13', 'arquivo.canal13.tv', 'corporate', 8, 12, 'Arquivo de imagens e e-mails de apresentadores que não deveriam existir.'),
  t('Seguradora Nada Cobre', 'sinistros.nadacobre.seg.br', 'corporate', 9, 14, 'Sinistros negados e o manual interno de como negar.'),
  t('Tribunal de Justiça Regional', 'processos.tjregional.jus.br', 'government', 10, 15, 'Processos sigilosos e sentenças antes da publicação.'),
  t('Distribuidora de Energia Faísca', 'medidores.faisca.energia.br', 'corporate', 10, 15, 'Medidores inteligentes e quem consome mais do que paga.'),
];

export const LOW_MID_TEMPLATES: TargetTemplate[] = [...LOW, ...MID_LOW, ...MID];

/** Original high-tier pool, with the old per-type Hasher ranges. */
const HIGH_RANGE: Record<string, [number, number]> = {
  government: [25, 50], cartel: [12, 27], bank: [12, 27], corporate: [6, 20], university: [1.2, 5.2], darkweb: [1.2, 5.2], personal: [1.2, 5.2],
};
export const withRange = (name: string, domain: string, type: TargetType, desc: string): TargetTemplate => {
  const [min, max] = HIGH_RANGE[type] || [1.2, 5.2];
  return { name, domain, type, desc, min, max };
};

export interface Band { min: number; max: number; }

/**
 * Difficulty band for a scan, relative to the player's best cracker: mostly
 * targets within reach, sometimes the next rung, rarely anything.
 */
export function scanBand(cracker: number, rng: Rng = Math.random): Band {
  const reach = Math.max(1.5, cracker);
  const roll = rng();
  if (roll < 0.65) return { min: 0.5, max: reach };
  if (roll < 0.92) return { min: reach, max: reach * 2 + 2 };
  return { min: 0.5, max: 60 };
}

export const inBand = (hasher: number, band: Band) => hasher >= band.min && hasher <= band.max;

const round1 = (n: number) => Number(n.toFixed(1));

/** Picks a template whose range overlaps the band and a Hasher inside both. */
export function pickInBand(templates: TargetTemplate[], band: Band, rng: Rng = Math.random): { template: TargetTemplate; hasher: number } {
  const fits = templates.filter(x => x.max >= band.min && x.min <= band.max);
  const pool = fits.length ? fits : templates.filter(x => x.max <= band.max).length ? templates.filter(x => x.max <= band.max) : LOW;
  const template = pool[Math.floor(rng() * pool.length)];
  const lo = Math.max(template.min, band.min);
  const hi = Math.max(lo, Math.min(template.max, band.max));
  return { template, hasher: round1(lo + rng() * (hi - lo)) };
}

/** Builds a full server from a template at a chosen Hasher. Shared by scans and the fixed catalog. */
export function buildTargetServer(template: TargetTemplate, hasherLevel: number, ip: string, suffix: number, rng: Rng, id?: string): VirtualServer {
  const isHighTier = hasherLevel >= 15;
  const isCartelOrBank = template.type === 'cartel' || template.type === 'bank';
  const firewallLevel = round1(Math.max(0.5, hasherLevel - rng() * (hasherLevel >= 12 ? 2 : 1)));
  const [sub, ...rest] = template.domain.split('.');

  return {
    id: id || `srv-${uuidv4().substring(0, 8)}`,
    ip,
    hostname: `${template.name} (#${suffix})`,
    domain: `${sub}-node${suffix}.${rest.join('.')}`,
    type: template.type,
    isOnline: true,
    description: template.desc,
    hardware: {
      cpuPower: round1(hasherLevel * 0.7 + 2.5),
      ramGb: isHighTier ? 256 : isCartelOrBank ? 64 : hasherLevel >= 3 ? 16 : 4,
      hddMb: isHighTier ? 150000 : isCartelOrBank ? 25000 : hasherLevel >= 3 ? 5000 : 1000,
      networkMbps: isHighTier ? 5000 : isCartelOrBank ? 1000 : hasherLevel >= 3 ? 100 : 20,
    },
    security: {
      hasherLevel,
      firewallLevel,
      password: `key_${Math.floor(10000 + rng() * 90000)}`,
      isBreached: false,
      openPorts: [
        { port: 80, service: 'HTTP', open: true, version: 'Nginx 1.24' },
        { port: 22, service: 'SSH', open: true, version: 'OpenSSH 9.0' },
        ...(isCartelOrBank ? [{ port: 443, service: 'TLS_VAULT', open: true, version: 'SecureVault v3' }] : []),
        ...(hasherLevel >= 30 ? [{ port: 9999, service: 'QUANTUM_PORT', open: true, version: 'QuantumGateway v5' }] : []),
      ],
    },
    files: [
      {
        id: `file-${suffix}-dat`,
        name: `dados_confidenciais_${suffix}.dat`,
        type: 'warez',
        version: round1(hasherLevel),
        sizeMb: Math.max(2, Math.round(hasherLevel * 15 + 20)),
        isInstalled: false,
      },
      ...(hasherLevel >= 6 ? [{
        id: `file-${suffix}-crc`,
        name: `CrackMaster_v${hasherLevel.toFixed(1)}.crc`,
        type: 'cracker' as const,
        version: round1(hasherLevel),
        sizeMb: Math.round(hasherLevel * 2 + 10),
        isInstalled: false,
      }] : []),
    ],
    bankAccounts: isCartelOrBank ? [{
      accountNumber: `ACC-${Math.floor(10000 + rng() * 90000)}`,
      bankIp: '12.189.44.10',
      bankName: 'MegaBank Global',
      balance: Math.round(hasherLevel * 15000 + rng() * 25000),
      password: `secret_${suffix}`,
      ownerName: template.name,
    }] : undefined,
    logs: [],
    activeMiners: [],
    rewardCash: Math.round(hasherLevel * 3500 + 1000),
    rewardRep: Math.round(hasherLevel * 450 + 150),
  };
}

/** Deterministic fixed servers for the catalog, so every world (and old databases) have them. */
export function buildCatalogServers(): VirtualServer[] {
  return LOW_MID_TEMPLATES.map(template => {
    const rng = seededRng(`catalog-${template.domain}`);
    const hasher = round1(template.min + rng() * (template.max - template.min));
    const ip = `${11 + Math.floor(rng() * 200)}.${Math.floor(rng() * 256)}.${Math.floor(rng() * 256)}.${2 + Math.floor(rng() * 250)}`;
    const suffix = 100 + Math.floor(rng() * 900);
    return buildTargetServer(template, hasher, ip, suffix, rng, `srv-cat-${template.domain.replace(/\./g, '-')}`);
  });
}

/** Adds the missing catalog servers. Returns the ones created. */
export function ensureTargets(servers: Map<string, VirtualServer>): VirtualServer[] {
  const created: VirtualServer[] = [];
  const hasId = new Set(Array.from(servers.values()).map(s => s.id));
  for (const server of buildCatalogServers()) {
    if (hasId.has(server.id) || servers.has(server.ip)) continue;
    servers.set(server.ip, server);
    created.push(server);
  }
  return created;
}
