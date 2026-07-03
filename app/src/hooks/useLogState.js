import { useState, useCallback } from 'react';

const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toLocaleTimeString('pt-BR', { hour12: false });

/**
 * Hook puro com toda a lógica de log. Sem JSX, sem Context.
 */
export function useLogState() {
  const [logs, setLogs] = useState([]);

  // useCallback com [] garante identidade estável — importante porque addLog
  // costuma ser chamada dentro de callbacks de socket/WebRTC (closures antigas).
  const addLog = useCallback((msg, type = '') => {
    setLogs(prev => [...prev, { id: uid(), time: now(), msg, type }]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, addLog, clearLogs };
}
