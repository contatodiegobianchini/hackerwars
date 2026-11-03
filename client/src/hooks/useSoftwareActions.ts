import { useGameStore } from '../stores/useGameStore.js';
import { SoftwareItem } from '../types/game.js';
import { bestSoftware } from '../game/bestSoftware.js';

export const useSoftwareActions = () => {
  const { player, activeConnection, startProcess } = useGameStore();

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
    const playerMiner = bestSoftware(player.software, 'miner');
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

  return {
    handleDownload,
    handleInstallMiner,
  };
};
