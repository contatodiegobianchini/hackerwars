import { useGameStore } from '../stores/useGameStore.js';
import { SoftwareItem } from '../types/game.js';

type GameStoreState = ReturnType<typeof useGameStore.getState>;

export const useAttacks = (storeOverride?: GameStoreState) => {
  const store = storeOverride || useGameStore();
  const { player, activeConnection, startProcess, bankTransfer } = store;

  const handleCrack = () => {
    if (!activeConnection) return;
    startProcess('crack', { targetIp: activeConnection.ip });
  };

  const handleScan = () => {
    if (!activeConnection) return;
    startProcess('scan', { targetIp: activeConnection.ip });
  };

  const handleDDoS = () => {
    if (!activeConnection) return;
    startProcess('ddos', {
      targetIp: activeConnection.ip,
      targetFileName: `Ataque DDoS em ${activeConnection.hostname}`
    });
  };

  const handlePlantSpyware = () => {
    if (!activeConnection || !player) return;
    const playerSpyware = player.software.find(s => s.type === 'spyware');
    if (!playerSpyware) {
      alert('Você precisa de um software Spyware instalado para implantar keylogger e monitorar esta vítima!');
      return;
    }
    startProcess('plant_spyware', {
      targetIp: activeConnection.ip,
      targetFileName: `Implantando Spyware Trojan (${playerSpyware.name})`,
    });
  };

  const handleMassBankHeist = () => {
    if (!activeConnection) return;
    if (confirm(`🚨 ALERTA MÁXIMO DE SEGURANÇA BANCÁRIA:\n\nExecutar o Mega-Assalto à Database Central de ${activeConnection.hostname} irá desviar todos os fundos de clientes e do cofre central de uma vez só!\n\nNo entanto, o FBI / INTERPOL DEFLAGRARÁ UM MANDADO DE PRISÃO IMEDIATAMENTE e você terá 45 segundos para se defender!\n\nDeseja prosseguir com o assalto agora?`)) {
      startProcess('mass_bank_heist', {
        targetIp: activeConnection.ip,
        targetFileName: `Infiltrando Database Central & Mega-Assalto em ${activeConnection.hostname}`,
      });
    }
  };

  const handleDownload = (file: SoftwareItem) => {
    if (!activeConnection) return;
    startProcess('download', {
      targetIp: activeConnection.ip,
      targetFileId: file.id,
      targetFileName: file.name,
    });
  };

  const handleInstallMiner = () => {
    if (!activeConnection || !player) return;
    const playerMiner = player.software.find(s => s.type === 'miner');
    if (!playerMiner) {
      alert('Você não possui um software minerador instalado!');
      return;
    }
    startProcess('upload', {
      targetIp: activeConnection.ip,
      softwareId: playerMiner.id,
      targetFileName: `CryptoMinerX v${playerMiner.version.toFixed(1)}`,
      details: { softwareId: playerMiner.id }
    });
  };

  const handleBankHeist = (victimAcc: { accountNumber: string; balance: number }) => {
    if (!activeConnection || !player) return;
    const playerAcc = player.bankAccounts[0];
    if (playerAcc) {
      bankTransfer(victimAcc.accountNumber, playerAcc.accountNumber, victimAcc.balance, activeConnection.ip);
    }
  };

  return {
    handleCrack,
    handleScan,
    handleDDoS,
    handlePlantSpyware,
    handleMassBankHeist,
    handleDownload,
    handleInstallMiner,
    handleBankHeist,
  };
};
