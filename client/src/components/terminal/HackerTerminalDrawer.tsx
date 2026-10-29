import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { Terminal, X, ChevronUp, ChevronDown, CornerDownLeft, Sparkles } from 'lucide-react';
import { sounds } from '../../utils/audio.js';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'system';
  text: string;
}

export const HackerTerminalDrawer: React.FC = () => {
  const {
    isTerminalOpen,
    toggleTerminal,
    player,
    executeTerminalCommand
  } = useGameStore();

  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '1', type: 'system', text: '=== HACKER WARS TERMINAL CONSOLE v2.4 ===' },
    { id: '2', type: 'system', text: 'Digite "help" para listar todos os comandos disponíveis ou use a interface gráfica.' },
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isTerminalOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isTerminalOpen, lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const cmd = inputVal.trim();
    const newLines: TerminalLine[] = [
      ...lines,
      { id: `in-${Date.now()}`, type: 'input', text: `root@${player?.username || 'user'}:~# ${cmd}` }
    ];

    if (cmd.toLowerCase() === 'clear') {
      setLines([
        { id: `init-${Date.now()}`, type: 'system', text: 'Terminal limpo. Digite "help" para ver comandos.' }
      ]);
    } else {
      const output = executeTerminalCommand(cmd);
      if (output) {
        newLines.push({ id: `out-${Date.now()}`, type: 'output', text: output });
      }
      setLines(newLines);
    }

    setHistory(prev => [...prev, cmd]);
    setHistoryIdx(-1);
    setInputVal('');
    sounds.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx >= history.length) {
          setHistoryIdx(-1);
          setInputVal('');
        } else {
          setHistoryIdx(nextIdx);
          setInputVal(history[nextIdx]);
        }
      }
    }
  };

  return (
    <>
      {/* Floating Toggle Button on bottom right (desktop only or high above bottom nav) */}
      <button
        onClick={toggleTerminal}
        className={`hidden md:flex fixed bottom-4 right-4 z-40 px-4 py-2 rounded-2xl shadow-xl font-mono text-xs font-bold transition items-center space-x-2 border ${
          isTerminalOpen
            ? 'bg-emerald-600 text-white border-emerald-400'
            : 'bg-[#1c1c1e] text-gray-300 border-[#2c2c2e] hover:border-emerald-500 hover:text-white'
        }`}
      >
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span>{isTerminalOpen ? 'Fechar Terminal' : '>_ Terminal CLI'}</span>
      </button>

      {/* Retractable Bottom Drawer */}
      {isTerminalOpen && (
        <div className="fixed bottom-0 left-0 right-0 h-[65vh] sm:h-80 bg-[#0d0d0d]/95 backdrop-blur-md border-t border-[#2c2c2e] z-50 flex flex-col font-mono text-xs select-none shadow-2xl animate-slide-up">
          {/* Header Bar */}
          <div className="h-10 bg-[#161618] border-b border-[#2c2c2e] px-3 sm:px-4 flex items-center justify-between text-gray-400">
            <div className="flex items-center space-x-2 truncate">
              <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-white font-bold tracking-wider text-[10px] sm:text-[11px] uppercase truncate">
                Console • root@{player?.username || 'localhost'} ({player?.ip})
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-gray-500 hidden sm:block">Dica: setas ↑ / ↓ para histórico</span>
              <button
                onClick={toggleTerminal}
                className="p-1 rounded-lg hover:bg-[#252528] text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Terminal Output Log Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 text-gray-200 select-text">
            {lines.map(line => (
              <div
                key={line.id}
                className={`leading-relaxed whitespace-pre-wrap ${
                  line.type === 'input'
                    ? 'text-emerald-400 font-semibold'
                    : line.type === 'system'
                      ? 'text-gray-400'
                      : 'text-gray-200'
                }`}
              >
                {line.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Command Prompt Form */}
          <form onSubmit={handleSubmit} className="h-11 bg-[#121214] border-t border-[#222224] px-4 flex items-center space-x-2">
            <span className="text-emerald-400 font-bold shrink-0">root@{player?.username || 'user'}:~#</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite um comando (ex: connect 104.18.23.99, crack, scan, ddos, wipe)..."
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs"
              autoFocus
            />
            <button type="submit" className="text-gray-500 hover:text-emerald-400 p-1">
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
