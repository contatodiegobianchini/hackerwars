import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { soundtrack } from '../../utils/soundtrack.js';
import { ShieldAlert, AlertTriangle, Radio, Volume2, EyeOff, Lock } from 'lucide-react';

export const CartelLockdownOverlay: React.FC = () => {
  const {
    player,
    isJumpscareVideoPlaying,
    setJumpscareVideoPlaying,
    clearLockdown
  } = useGameStore();

  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const lockdownUntil = player?.lockdownUntil || 0;
  const isLockdownActive = lockdownUntil > Date.now();

  useEffect(() => {
    if (isJumpscareVideoPlaying) {
      soundtrack.duck();
    } else {
      soundtrack.unduck();
    }
  }, [isJumpscareVideoPlaying]);

  useEffect(() => {
    if (!isLockdownActive) {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((lockdownUntil - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearLockdown();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockdownUntil, isLockdownActive]);

  const handleVideoEnded = () => {
    setJumpscareVideoPlaying(false);
    soundtrack.unduck();
  };

  // 1. Jumpscare Fullscreen Video Modal
  if (isJumpscareVideoPlaying) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-red-950/20 pointer-events-none z-10 animate-pulse" />

        <video
          ref={videoRef}
          src="/cartel_video.mp4"
          autoPlay
          playsInline
          onEnded={handleVideoEnded}
          onError={handleVideoEnded}
          className="w-full h-full object-cover"
        />

        {/* Skip button fallback after 5s in case video hangs */}
        <button
          onClick={handleVideoEnded}
          className="absolute bottom-6 right-6 z-20 bg-black/60 hover:bg-black/90 text-white/70 hover:text-white px-4 py-2 rounded-xl text-xs font-mono backdrop-blur-sm border border-white/10 transition"
        >
          Pular para a Encolha ➔
        </button>
      </div>
    );
  }

  // 2. 5-Minute Lockdown Screen ("Na Encolha")
  if (isLockdownActive) {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const totalLockdownSeconds = 300;
    const progressPercent = Math.min(100, Math.max(0, Math.round(((totalLockdownSeconds - secondsLeft) / totalLockdownSeconds) * 100)));

    const getFlavorText = () => {
      if (secondsLeft > 240) return 'Carros pretos sem placa foram vistos rondando a sua rua...';
      if (secondsLeft > 180) return 'Sicários do cartel estão monitorando os roteadores da sua vizinhança...';
      if (secondsLeft > 120) return 'Mantenha as luzes apagadas e o terminal desligado...';
      if (secondsLeft > 60) return 'A movimentação suspeita começou a se dispersar...';
      return 'Quase seguro... A poeira está finalmente baixando.';
    };

    return (
      <div className="fixed inset-0 z-[90] bg-[#060606]/98 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="max-w-md w-full bg-[#111113] border border-red-900/60 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden">
          {/* Pulsing Alert Glow */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Header */}
          <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-500 shadow-inner animate-pulse">
            <EyeOff className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-mono font-bold text-red-500 uppercase tracking-widest flex items-center justify-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>RETALIAÇÃO DO CARTEL ATIVADA</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Você está na encolha!
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
              Aguarde para não ser pego pelo cartel! Os assassinos rastrearam seu IP e estão fazendo buscas na sua região.
            </p>
          </div>

          {/* Large Countdown Display */}
          <div className="w-full bg-[#0a0a0c] border border-[#222226] rounded-2xl py-6 px-4 font-mono">
            <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">TEMPO RESTANTE NA ENCOLHA</div>
            <div className="text-4xl font-black text-red-500 tracking-wider mt-1 drop-shadow-md">
              {formattedTime}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden mt-4 border border-gray-800">
              <div
                className="h-full bg-red-600 transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Suspense Story Ticker */}
          <div className="text-xs font-mono text-gray-400 italic bg-[#161619] border border-[#26262a] p-3.5 rounded-xl w-full">
            "{getFlavorText()}"
          </div>

          <div className="text-[10px] text-gray-600 font-mono">
            O acesso aos servidores e ferramentas do jogo será restabelecido automaticamente ao término do contador.
          </div>
        </div>
      </div>
    );
  }

  return null;
};
