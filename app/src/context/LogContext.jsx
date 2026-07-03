import { createContext, useContext } from 'react';
import { useLogState } from '../hooks/useLogState';

const LogContext = createContext(null);

/**
 * Provider de log. Qualquer função em qualquer componente/callback da árvore
 * pode chamar addLog(...) sem precisar receber via props.
 *
 * Toda a lógica mora em useLogState(); este arquivo só distribui a instância.
 */
export function LogProvider({ children }) {
  const state = useLogState();

  return (
    <LogContext.Provider value={state}>
      {children}
    </LogContext.Provider>
  );
}

export function useLog() {
  const ctx = useContext(LogContext);
  if (!ctx) {
    throw new Error('useLog precisa ser usado dentro de um <LogProvider>');
  }
  return ctx;
}
