import { useState, useRef } from 'react';

/**
 * Hook puro com toda a lógica de estado de conexão/sinalização.
 * Sem JSX, sem Context — pode ser testado isoladamente ou usado
 * fora de um Provider se algum dia precisar de uma instância independente.
 */
export function useConnectionState() {
  // ── Configuração do servidor / sala ──
  const [srvUrl, setSrvUrl] = useState('http://localhost:3000');
  const [room, setRoom] = useState('sala-01');
  const [username, setUsername] = useState('Usuário Anônimo'); // usado só no Chat, inofensivo nos outros

  // ── Status visual (bolinhas) ──
  const [dotWs, setDotWs] = useState('muted');
  const [dotRoom, setDotRoom] = useState('muted');
  const [dotPeer, setDotPeer] = useState('muted');

  // ── Flags de habilitação de UI ──
  const [isConnected, setIsConnected] = useState(false);

  // ── Referência viva do socket (compartilhável entre handlers) ──
  const socketRef = useRef(null);

  // Helper opcional: reseta tudo pro estado inicial (útil em disconnect/hangup)
  const resetConnectionStatus = () => {
    setDotWs('red');
    setDotRoom('red');
    setDotPeer('muted');
    setIsConnected(false);
  };

  return {
    srvUrl, setSrvUrl,
    room, setRoom,
    username, setUsername,
    dotWs, setDotWs,
    dotRoom, setDotRoom,
    dotPeer, setDotPeer,
    isConnected, setIsConnected,
    socketRef,
    resetConnectionStatus,
  };
}
