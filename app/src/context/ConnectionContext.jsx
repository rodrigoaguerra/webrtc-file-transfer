import { createContext, useContext } from 'react';
import { useConnectionState } from '../hooks/useConnectionState';

const ConnectionContext = createContext(null);

/**
 * Provider de estado de conexão/sinalização.
 * Cada página (Video/Transfer/Chat) envolve seu conteúdo com <ConnectionProvider>
 * e mantém sua própria lógica de handleConnect — só o ESTADO fica centralizado aqui.
 *
 * Toda a lógica de fato mora em useConnectionState(); este arquivo só garante
 * que exista UMA instância compartilhada por todos os consumidores da subárvore.
 */
export function ConnectionProvider({ children }) {
  const state = useConnectionState();

  return (
    <ConnectionContext.Provider value={state}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error('useConnection precisa ser usado dentro de um <ConnectionProvider>');
  }
  return ctx;
}
