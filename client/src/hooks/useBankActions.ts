import { useGameStore } from '../stores/useGameStore.js';
import { BankAccount } from '../types/game.js';

export const useBankActions = () => {
  const {
    player,
    activeConnection,
    startProcess,
    bankTransfer,
    siphonVictimAccount,
    siphonVictimCrypto,
  } = useGameStore();

  const handleMassBankHeist = () => {
    if (!activeConnection) return;
    if (
      confirm(
        `🚨 ALERTA MÁXIMO DE SEGURANÇA BANCÁRIA:\n\nExecutar o Mega-Assalto à Database Central de ${activeConnection.hostname} irá desviar todos os fundos de clientes e do cofre central de uma vez só!\n\nNo entanto, o FBI / INTERPOL DEFLAGRARÁ UM MANDADO DE PRISÃO IMEDIATAMENTE e você terá 45 segundos para se defender!\n\nDeseja prosseguir com o assalto agora?`
      )
    ) {
      startProcess('mass_bank_heist', {
        targetIp: activeConnection.ip,
        targetFileName: `Infiltrando Database Central & Mega-Assalto em ${activeConnection.hostname}`,
      });
    }
  };

  const handleBankHeist = (victimAcc: BankAccount) => {
    if (!activeConnection || !player) return;
    const playerAcc = player.bankAccounts[0];
    if (playerAcc) {
      bankTransfer(victimAcc.accountNumber, playerAcc.accountNumber, victimAcc.balance, activeConnection.ip);
    }
  };

  const handleSiphonAccount = (accountNumber: string) => {
    if (!activeConnection) return;
    siphonVictimAccount(activeConnection.ip, accountNumber);
  };

  const handleSiphonCrypto = (address: string) => {
    if (!activeConnection) return;
    siphonVictimCrypto(activeConnection.ip, address);
  };

  return {
    handleMassBankHeist,
    handleBankHeist,
    handleSiphonAccount,
    handleSiphonCrypto,
  };
};
