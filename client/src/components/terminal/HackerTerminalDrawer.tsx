import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { Terminal, X, CornerDownLeft } from 'lucide-react';
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
    { id: '1', type: 'system', text: 'Hacker Wars · terminal' },
    { id: '2', type: 'system', text: 'Digite "help" para ver os comandos. A tecla ` abre e fecha o terminal.' },
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

  if (!isTerminalOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-[55vh] min-h-[240px] max-h-[85vh] sm:h-[360px] flex-col border-t border-gray-300 font-mono text-[13px] shadow-2xl"
      style={{ background: 'var(--ink)', animation: 'drawer-in-up .16s ease-out' }} role="dialog" aria-label="Terminal">
      <div className="flex h-10 items-center justify-between gap-3 border-b border-gray-200 px-4" style={{ fontFamily: 'var(--font-text)' }}>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Terminal className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="truncate text-gray-900">Terminal · root@{player?.username || 'localhost'}</span>
          <span className="hidden sm:inline text-gray-500 font-mono text-xs">{player?.ip}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="hidden sm:flex items-center gap-1.5">Abrir e fechar: <kbd className="hw-kbd">`</kbd></span>
          <span className="hidden md:inline">Histórico: ↑ ↓</span>
          <button onClick={toggleTerminal} className="hw-icon-btn !h-8 !w-8" aria-label="Fechar terminal"><X /></button>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-4 text-gray-200 select-text">
        {lines.map(line => (
          <div key={line.id} className={`whitespace-pre-wrap leading-relaxed ${line.type === 'input' ? 'text-amber-500' : line.type === 'system' ? 'text-gray-500' : 'text-gray-200'}`}>
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex h-12 items-center gap-2 border-t border-gray-200 px-4" style={{ background: 'var(--inset)' }}>
        <span className="shrink-0 font-semibold text-amber-500">root@{player?.username || 'user'}:~#</span>
        <input
          id="terminal-command"
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="help, connect 104.18.23.99, crack, scan, wipe…"
          className="flex-1 min-w-0 border-none bg-transparent font-mono text-[13px] text-gray-900 outline-none"
          style={{ background: 'transparent' }}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="p-1 text-gray-500 hover:text-amber-500" aria-label="Executar comando">
          <CornerDownLeft className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
