import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  HelpCircle,
  Globe,
  Key,
  Download,
  Trash2,
  Cpu,
  ArrowRight
} from 'lucide-react';

export const TutorialView: React.FC = () => {
  const { setCurrentView } = useGameStore();

  const steps = [
    {
      number: '1',
      title: 'Conectar a um Servidor Alvo',
      icon: Globe,
      description: 'Vá na aba "Servidores & Alvos" no menu lateral. Escolha um alvo fácil com poucas estrelas (como a universidade MIT Lab) e clique em "Conectar".',
      actionText: 'Ver Servidores',
      actionView: 'known_servers' as const,
    },
    {
      number: '2',
      title: 'Quebrar a Senha (Acesso Root)',
      icon: Key,
      description: 'Na tela do servidor conectado, clique em "Iniciar Quebra de Senha". Seu Cracker começará a quebrar a criptografia do alvo na Fila de Processos.',
      actionText: 'Ver Servidor Conectado',
      actionView: 'target_server' as const,
    },
    {
      number: '3',
      title: 'Baixar Arquivos ou Instalar Mineradores',
      icon: Download,
      description: 'Com o acesso ROOT obtido, vá na aba "Arquivos". Você pode baixar versões melhores de Crackers/Hashers ou clicar em "Instalar Minerador" para gerar Bitcoins passivos a cada 5 segundos!',
      actionText: 'Meus Softwares',
      actionView: 'software' as const,
    },
    {
      number: '4',
      title: 'LIMPAR SEUS RASTROS NOS LOGS!',
      icon: Trash2,
      description: 'IMPORTANTE: Toda ação sua grava seu endereço IP nos logs do servidor. Vá na aba "Logs" e clique em "Limpar Todos os Logs" para não ser rastreado nem multado pelo FCB / FBI!',
      actionText: 'Entendido',
      actionView: 'known_servers' as const,
    },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 text-center sm:text-left shadow-sm">
        <div className="flex items-center justify-center sm:justify-start space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Guia Rápido: Como Jogar Hacker Experience</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Não precisa saber programação nem comandos difíceis! O jogo é 100% intuitivo e baseado em estratégia.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map(step => {
          return (
            <div
              key={step.number}
              className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xs font-mono text-gray-900">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">{step.title}</h3>
                </div>

                <p className="text-xs text-gray-600 mt-3 leading-relaxed">{step.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setCurrentView(step.actionView)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1"
                >
                  <span>{step.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progression Tips */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-gray-700" />
          <span>Dicas para Evoluir Rápido</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <strong className="text-gray-900 block mb-1">1. Faça Upgrade de RAM</strong>
            Com mais memória RAM, você pode quebrar senhas, baixar arquivos e minerar moedas ao mesmo tempo!
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <strong className="text-gray-900 block mb-1">2. Crie uma Fazenda de Mineração</strong>
            Instale mineradores em todos os servidores hackeados para ter renda passiva constante em Bitcoin.
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <strong className="text-gray-900 block mb-1">3. Invada Bancos</strong>
            Quando seu Cracker estiver forte (nível 2.5+), invada o Ironclad Bank ou Central Bank e drene os cofres.
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={() => setCurrentView('known_servers')}
            className="bg-black hover:bg-gray-800 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-sm transition"
          >
            Começar a Jogar Agora!
          </button>
        </div>
      </div>
    </div>
  );
};
