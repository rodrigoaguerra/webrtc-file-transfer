import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import HeaderComponent from '../components/HeaderComponent';
import StatusComponent from '../components/StatusComponent';
import ConectionComponent from '../components/ConectionComponent';
import ActionsComponent from '../components/ActionsComponent';
import VideoGridComponent from '../components/VideoGridComponent';
import LogComponent from '../components/LogComponent';
import { Card, CardTitle } from '../layouts/RootLayout';
import { ConnectionProvider, useConnection } from '../context/ConnectionContext';
import { LogProvider, useLog } from '../context/LogContext';
import { RTC_CONFIG_BASIC } from '../config/webrtcConfig';

// Componente "de fora" só monta os Providers.
// Assim cada Page tem sua própria instância de estado — não é global na app inteira.
export default function VideoPage() {
  return (
    <ConnectionProvider>
      <LogProvider>
        <VideoPageContent />
      </LogProvider>
    </ConnectionProvider>
  );
}

// Todo o conteúdo/lógica que antes estava direto em VideoPage foi movido pra cá,
// agora consumindo os Contexts em vez de useState local.
function VideoPageContent() {
  // ── Estado vindo dos Contexts (antes era useState local) ──
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

  // ── Estado que continua local (é específico do módulo de vídeo) ──
  const [cameraDisabled, setCameraDisabled] = useState(true);
  const [callDisabled, setCallDisabled] = useState(true);
  const [hangupDisabled, setHangupDisabled] = useState(true);
  const [showLocalPh, setShowLocalPh] = useState(true);
  const [showRemotePh, setShowRemotePh] = useState(true);

  // ── Referências de Instância (WebRTC & Sinalização) ──
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const currentRoomRef = useRef('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    addLog('Pronto. Configure o servidor e clique em Conectar.', 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (event, payload = {}) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit(event, payload);
  };

  // ── Conexão com o Servidor de Sinalização ──
  const handleConnect = () => {
    const url = srvUrl.trim();
    currentRoomRef.current = room.trim();

    const socket = io(url);
    socketRef.current = socket;

    setDotWs('yellow');
    addLog(`Conectando em ${url}…`, 'info');

    socket.on('connect', () => {
      setDotWs('green');
      addLog('Socket.IO conectado!', 'success');

      socket.emit('join-room', { room: currentRoomRef.current });

      setDotRoom('green');
      addLog(`Entrou na sala "${currentRoomRef.current}"`, 'success');

      setIsConnected(true);
      setCameraDisabled(false);
    });

    socket.on('offer', async ({ offer }) => {
      addLog('Offer recebida — respondendo…', 'info');
      try {
        await ensurePeerConnection();
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);

        send('answer', { answer, room: currentRoomRef.current });
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
          addLog('ICE candidate adicionado', '');
        } catch (err) {
          addLog(`Erro ao adicionar ICE: ${err.message}`, 'error');
        }
      }
    });

    socket.on('disconnect', () => {
      setDotWs('red');
      setDotRoom('red');
      addLog('Socket desconectado', 'error');

      setIsConnected(false);
      setCameraDisabled(true);
      setCallDisabled(true);
    });

    socket.on('connect_error', () => {
      addLog('Erro de conexão no Socket.IO', 'error');
      setDotWs('red');
    });
  };

  // ── PeerConnection ──
  const ensurePeerConnection = async () => {
    if (pcRef.current) return;
    const pc = new RTCPeerConnection(RTC_CONFIG_BASIC);
    pcRef.current = pc;
    setDotPeer('yellow');
    addLog('PeerConnection criada', 'info');

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) send('candidate', { candidate, room: currentRoomRef.current });
    };

    pc.ontrack = ({ streams }) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = streams[0];
      setShowRemotePh(false);
      setDotPeer('green');
      addLog('Stream remoto recebido 🎉', 'success');
    };

    pc.onconnectionstatechange = () => {
      addLog(`Peer state: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') setDotPeer('green');
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') setDotPeer('red');
    };
  };

  // ── Câmera ──
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setShowLocalPh(false);
      addLog('Câmera e microfone ativos', 'success');

      setCallDisabled(false);
      setCameraDisabled(true);
      setHangupDisabled(false);
    } catch (e) {
      addLog(`Câmera negada: ${e.message}`, 'error');
    }
  };

  // ── Ligar ──
  const handleCall = async () => {
    await ensurePeerConnection();
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    send('offer', { offer, room: currentRoomRef.current });
    addLog('Offer enviada — aguardando resposta…', 'info');
    setCallDisabled(true);
  };

  // ── Desligar ──
  const handleHangup = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setShowLocalPh(true);
    setShowRemotePh(true);
    setDotPeer('muted');

    setHangupDisabled(true);
    setCallDisabled(true);
    setCameraDisabled(false);

    addLog('Chamada encerrada', 'warn');
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

        <ActionsComponent
          cameraDisabled={cameraDisabled}
          callDisabled={callDisabled}
          hangupDisabled={hangupDisabled}
          handleStartCamera={handleStartCamera}
          handleCall={handleCall}
          handleHangup={handleHangup}
        />
      </Card>

      <VideoGridComponent
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        showLocalPh={showLocalPh}
        showRemotePh={showRemotePh}
      />

      <Card>
        <CardTitle>Log</CardTitle>
        <LogComponent logs={logs} onClear={clearLogs} />
      </Card>
    </>
  );
}
