import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import HeaderComponent from '../components/HeaderComponent';
import StatusComponent from '../components/StatusComponent';
import ConectionComponent from '../components/ConectionComponent';
import LogComponent from '../components/LogComponent';
import { Card, CardTitle } from '../layouts/RootLayout';
import { ConnectionProvider, useConnection } from '../context/ConnectionContext';
import { LogProvider, useLog } from '../context/LogContext';
import { RTC_CONFIG_BASIC } from '../config/webrtcConfig';

import BreakoutGame from '../components/BreakoutGame';

// Componente "de fora" só monta os Providers — mesmo padrão da VideoPage,
// pra essa página ter sua própria instância de estado de conexão.
export default function GamePage() {
  return (
    <ConnectionProvider>
      <LogProvider>
        <GamePageContent />
      </LogProvider>
    </ConnectionProvider>
  );
}

function GamePageContent() {
  const {
    srvUrl,
    setSrvUrl,
    room,
    setRoom,
    dotWs,
    setDotWs,
    dotRoom,
    setDotRoom,
    dotPeer,
    setDotPeer,
    isConnected,
    setIsConnected,
    socketRef,
  } = useConnection();

  const { logs, addLog, clearLogs } = useLog();

  // ── Referências de Instância (WebRTC & Sinalização) ──
  const pcRef = useRef(null);
  const dataChannelRef = useRef(null);
  const currentRoomRef = useRef('');
  const remoteSocketIdRef = useRef(null);

  // Quem cria a offer (e o data channel) vira o "host" da partida.
  // Convenção simples: host = quem já estava na sala quando o outro entrou.
  // Útil se você quiser que só um dos lados simule a física da bola
  // (o outro só envia a posição da própria palheta) pra evitar dessincronia.
  const [isHost, setIsHost] = useState(false);

  // true quando o data channel do jogo está aberto e pronto pra uso
  const [channelReady, setChannelReady] = useState(false);

  // Última mensagem recebida do peer remoto (ex: { type: 'paddle', y: 120 })
  const [lastMessage, setLastMessage] = useState(null);

  // Callback opcional pra quem consumir a página via prop/ref, se preferir
  // assinar em vez de ler `lastMessage` por render.
  const onMessageRef = useRef(null);

  useEffect(() => {
    addLog('Pronto. Configure o servidor e clique em Conectar.', 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (event, payload = {}) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit(event, payload);
  };

  // ── Envio de dados do jogo (posição da palheta, estado da bola, etc.) ──
  const sendMove = useCallback((data) => {
    const channel = dataChannelRef.current;
    if (channel && channel.readyState === 'open') {
      channel.send(JSON.stringify(data));
    }
  }, []);

  const setupDataChannel = (channel) => {
    dataChannelRef.current = channel;

    channel.onopen = () => {
      setDotPeer('green');
      setChannelReady(true);
      addLog('Canal de dados do jogo aberto 🎮', 'success');
    };

    channel.onclose = () => {
      setChannelReady(false);
      addLog('Canal de dados fechado', 'error');
    };

    channel.onerror = (err) => {
      addLog(`Erro no canal de dados: ${err.message || err}`, 'error');
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        if (onMessageRef.current) onMessageRef.current(data);
      } catch (err) {
        addLog(`Mensagem inválida recebida: ${err.message}`, 'error');
      }
    };
  };

  // ── Conexão com o Servidor de Sinalização ──
  const handleConnect = () => {
    const url = srvUrl.trim();
    currentRoomRef.current = room.trim();

    const socket = io(url);
    socketRef.current = socket;

    setDotWs('yellow');
    addLog(`Conectando em ${url}…`, 'info');

    socket.on('connect', async () => {
      setDotWs('green');
      addLog('Socket.IO conectado!', 'success');

      socket.emit('join-room', { room: currentRoomRef.current });

      setDotRoom('green');
      addLog(`Entrou na sala "${currentRoomRef.current}"`, 'success');

      setIsConnected(true);
    });

    // Quem já estava na sala recebe esse evento quando o 2º jogador entra.
    // Esse lado cria a PeerConnection, o Data Channel e a offer → vira o host.
    socket.on('user-connected', async ({ id }) => {
      if (!id || id === socket.id) return;
      remoteSocketIdRef.current = id;
      addLog(`Outro jogador entrou na sala: ${id}`, 'info');
      setIsHost(true);
      try {
        await ensurePeerConnection(id, { createChannel: true });
      } catch (err) {
        addLog(`Erro ao iniciar conexão com o jogador: ${err.message}`, 'error');
      }
    });

    socket.on('offer', async ({ offer, from }) => {
      addLog('Offer recebida — respondendo…', 'info');
      try {
        remoteSocketIdRef.current = from || remoteSocketIdRef.current;
        // Quem responde a offer não cria o channel: ele chega via 'ondatachannel'.
        await ensurePeerConnection(remoteSocketIdRef.current, { createChannel: false });
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);

        send('answer', { answer, room: currentRoomRef.current, to: remoteSocketIdRef.current });
      } catch (err) {
        addLog(`Erro ao processar Offer: ${err.message}`, 'error');
      }
    });

    socket.on('answer', async ({ answer }) => {
      addLog('Answer recebida', 'info');
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        addLog(`Erro ao aplicar Answer: ${err.message}`, 'error');
      }
    });

    socket.on('candidate', async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          addLog('ICE candidate adicionado', 'info');
        } catch (err) {
          addLog(`Erro ao adicionar ICE: ${err.message}`, 'error');
        }
      }
    });

    socket.on('disconnect', () => {
      setDotWs('red');
      setDotRoom('red');
      setDotPeer('red');
      setChannelReady(false);
      addLog('Socket desconectado', 'error');
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      addLog('Erro de conexão no Socket.IO', 'error');
      setDotWs('red');
    });
  };

  const ensurePeerConnection = async (remoteSocketId = null, { createChannel = false } = {}) => {
    if (!pcRef.current) {
      const pc = new RTCPeerConnection(RTC_CONFIG_BASIC);
      pcRef.current = pc;
      setDotPeer('yellow');
      addLog('PeerConnection criada', 'info');

      pc.onicecandidate = ({ candidate }) => {
        if (candidate && remoteSocketIdRef.current) {
          send('candidate', { candidate, room: currentRoomRef.current, to: remoteSocketIdRef.current });
        }
      };

      // Lado que NÃO criou o channel recebe ele aqui.
      pc.ondatachannel = (event) => {
        addLog('Canal de dados recebido do host', 'info');
        setupDataChannel(event.channel);
      };

      pc.onconnectionstatechange = () => {
        addLog(`Peer state: ${pc.connectionState}`, 'info');
        if (pc.connectionState === 'connected') setDotPeer('green');
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') setDotPeer('red');
      };
    }

    if (createChannel && !dataChannelRef.current) {
      // unordered + sem retransmissão: prioriza latência baixa sobre garantia
      // de entrega, ideal pra posição de palheta/bola em tempo real.
      const channel = pcRef.current.createDataChannel('game', {
        ordered: false,
        maxRetransmits: 0,
      });
      setupDataChannel(channel);
    }

    if (remoteSocketId) {
      remoteSocketIdRef.current = remoteSocketId;
      if (createChannel && !pcRef.current.localDescription) {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        send('offer', { offer, room: currentRoomRef.current, to: remoteSocketId });
        addLog(`Oferta enviada para ${remoteSocketId}`, 'info');
      }
    }

    return pcRef.current;
  };

  return (
    <>
      <Card>
        <CardTitle>Conexão</CardTitle>

        <StatusComponent dotWs={dotWs} dotRoom={dotRoom} dotPeer={dotPeer} />

        <ConectionComponent
          srvUrl={srvUrl}
          setSrvUrl={setSrvUrl}
          room={room}
          setRoom={setRoom}
          handleConnect={handleConnect}
          connectDisabled={isConnected}
        />
      </Card>

      <Card>
        <CardTitle>Jogo</CardTitle>
        <BreakoutGame
          isHost={isHost}
          connectionReady={channelReady}
          sendMove={sendMove}
          onMessage={(cb) => {
            onMessageRef.current = cb;
          }}
        />
      </Card>

      <Card>
        <CardTitle>Log</CardTitle>
        <LogComponent logs={logs} onClear={clearLogs} />
      </Card>
    </>
  );
}
