import { CpuSpec, GpuSpec, RamSpec, HddSpec, NetworkSpec, VpnSpec } from '../types/game.js';

export const CPU_TIERS: CpuSpec[] = [
  { level: 1, name: 'CyberCore i3-2100 (2.0 GHz)', clockSpeedGhz: 2.0, cost: 0 },
  { level: 2, name: 'CyberCore i5-4670 (3.2 GHz)', clockSpeedGhz: 3.2, cost: 750 },
  { level: 3, name: 'Ryzen Cyber 3700X (4.2 GHz)', clockSpeedGhz: 4.2, cost: 2200 },
  { level: 4, name: 'Threadripper 3990X (5.0 GHz)', clockSpeedGhz: 5.0, cost: 6500 },
  { level: 5, name: 'Quantum Neural CPU (8.5 GHz)', clockSpeedGhz: 8.5, cost: 18000 },
];

export const GPU_TIERS: GpuSpec[] = [
  { level: 1, name: 'Vídeo Integrado HD Graphics (0.5 TFLOPS)', tflops: 0.5, miningMultiplier: 1.0, cost: 0 },
  { level: 2, name: 'GeForce GTX 1660 Super (5.0 TFLOPS)', tflops: 5.0, miningMultiplier: 2.2, cost: 850 },
  { level: 3, name: 'RTX 3070 CyberEdition (20.0 TFLOPS)', tflops: 20.0, miningMultiplier: 5.5, cost: 2400 },
  { level: 4, name: 'RTX 4090 Matrix Extreme (82.0 TFLOPS)', tflops: 82.0, miningMultiplier: 14.0, cost: 6800 },
  { level: 5, name: 'Quantum Tensor Accelerator (300.0 TFLOPS)', tflops: 300.0, miningMultiplier: 40.0, cost: 18000 },
];

export const RAM_TIERS: RamSpec[] = [
  { level: 1, name: '4GB DDR3 (2 Tasks)', capacityGb: 4, maxTasks: 2, cost: 0 },
  { level: 2, name: '8GB DDR4 (3 Tasks)', capacityGb: 8, maxTasks: 3, cost: 600 },
  { level: 3, name: '16GB DDR4 (5 Tasks)', capacityGb: 16, maxTasks: 5, cost: 1800 },
  { level: 4, name: '32GB DDR5 (8 Tasks)', capacityGb: 32, maxTasks: 8, cost: 4500 },
  { level: 5, name: '64GB Quantum RAM (14 Tasks)', capacityGb: 64, maxTasks: 14, cost: 12000 },
];

export const HDD_TIERS: HddSpec[] = [
  { level: 1, name: '500MB Virtual Storage', capacityMb: 500, usedMb: 60, cost: 0 },
  { level: 2, name: '2000MB NVMe SSD', capacityMb: 2000, usedMb: 60, cost: 400 },
  { level: 3, name: '8000MB Ultra RAID', capacityMb: 8000, usedMb: 60, cost: 1200 },
  { level: 4, name: '25000MB Optane Array', capacityMb: 25000, usedMb: 60, cost: 3500 },
  { level: 5, name: '100000MB Holographic Drive', capacityMb: 100000, usedMb: 60, cost: 9000 },
];

export const NETWORK_TIERS: NetworkSpec[] = [
  { level: 1, name: 'ADSL 10 Mbps', speedMbps: 10, cost: 0 },
  { level: 2, name: 'Fibra Óptica 50 Mbps', speedMbps: 50, cost: 500 },
  { level: 3, name: 'Gigabit Fiber 250 Mbps', speedMbps: 250, cost: 1500 },
  { level: 4, name: 'Direct Backbone 1000 Mbps', speedMbps: 1000, cost: 4800 },
  { level: 5, name: 'Satellite Laser Link 5000 Mbps', speedMbps: 5000, cost: 14000 },
];

export const VPN_TIERS: VpnSpec[] = [
  {
    level: 1,
    name: 'Tor Básico Comunitário (1 Nó)',
    nodesCount: 1,
    traceDelaySec: 0,
    encryptionType: 'TLS 1.2 Básico',
    cost: 0
  },
  {
    level: 2,
    name: 'CyberTunnel Stealth VPN (2 Nós)',
    nodesCount: 2,
    traceDelaySec: 25,
    encryptionType: 'AES-256 Multi-Hop (Suécia)',
    cost: 800
  },
  {
    level: 3,
    name: 'ShadowGuard Offshore VPN (3 Nós)',
    nodesCount: 3,
    traceDelaySec: 60,
    encryptionType: 'ChaCha20 Triplo Salto (Panamá/Suíça)',
    cost: 2500
  },
  {
    level: 4,
    name: 'OnionGhost Zero-Logs Network (4 Nós)',
    nodesCount: 4,
    traceDelaySec: 120,
    encryptionType: 'Tor Militar Zero-Knowledge 4-Hop',
    cost: 7000
  },
  {
    level: 5,
    name: 'Quantum Phantom TOR Mesh (5 Nós)',
    nodesCount: 5,
    traceDelaySec: 240,
    encryptionType: 'Quântico Satelital P2P Descentralizado',
    cost: 18000
  },
];

export const COOLING_TIERS = [
  {
    level: 1,
    name: 'Cooler Stock Básico (Air Cooler)',
    tempReductionPct: 0,
    maxSafeTasks: 2,
    cost: 0,
  },
  {
    level: 2,
    name: 'Dual Fan RGB Stealth (Cooler Master)',
    tempReductionPct: 25,
    maxSafeTasks: 3,
    cost: 900,
  },
  {
    level: 3,
    name: 'Water Cooler 360mm AIO (Kraken X73)',
    tempReductionPct: 50,
    maxSafeTasks: 5,
    cost: 2800,
  },
  {
    level: 4,
    name: 'Custom Loop Liquid Cooling (EKWB Block)',
    tempReductionPct: 75,
    maxSafeTasks: 8,
    cost: 7500,
  },
  {
    level: 5,
    name: 'Sub-Zero Cryogenic Cooling (Nitrogênio Líquido)',
    tempReductionPct: 100,
    maxSafeTasks: 14,
    cost: 18000,
  },
];
