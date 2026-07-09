import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Box, Typography, styled } from '@mui/material';
import { Card, CardTitle } from '../layouts/RootLayout';
import { ConnectionProvider, useConnection } from '../context/ConnectionContext';
import { LogProvider, useLog } from '../context/LogContext';
import HeaderComponent from '../components/HeaderComponent';
import StatusComponent from '../components/StatusComponent';
import ConectionComponent from '../components/ConectionComponent';
import ContainerChat from '../components/ContainerChat';
import InputsChat from '../components/InputsChat';
import LogComponent from '../components/LogComponent';
import { RTC_CONFIG_FULL } from '../config/webrtcConfig';

export default function VideoPage() {
  return (
    <ConnectionProvider>
      <LogProvider>
        <ChatPageContent />
      </LogProvider>
    </ConnectionProvider>
  );
}

function ChatPageContent() {
  // ── Estado vindo dos Contexts ──
  const {
    srvUrl, 
    setSrvUrl,
    username,
    setUsername,
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
  
  // ── Estados do Chat e Participantes ──
  const [participants, setParticipants] = useState(new Map()); // id -> name
  const [privateTarget, setPrivateTarget] = useState(null); // id ou null (grupo)
  const [messages, setMessages] = useState([]); // Array de objetos de mensagem
  const [messageText, setMessageText] = useState('');

  // ── Estados de Gravação de Mídia ──
  const [isRecording, setIsRecording] = useState(false);
  const [recLabel, setRecLabel] = useState('Gravando...');

  // ── Referências de Instância (WebRTC, Sockets e Fluxos) ──
  const peersRef = useRef({});         // { socketId: RTCPeerConnection }
  const dataChannelsRef = useRef({});  // { socketId: RTCDataChannel }
  const peerNamesRef = useRef({});     // { socketId: username }
  const fileTransfersRef = useRef({}); // { transferId: { chunks, received... } }
  const fileInputRef = useRef(null);

  // Mídias
  const mediaRecorderRef = useRef(null);
  const recChunksRef = useRef([]);
  const recStreamRef = useRef(null);
  const recTimerIntervalRef = useRef(null);

  // ── Constantes e Configurações Globais do app.js ──
  const CHUNK_SIZE = 64 * 1024; // 64KB
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

  const updatePeerStatusDot = () => {
    const activePeers = Object.keys(dataChannelsRef.current).filter(
      id => dataChannelsRef.current[id].readyState === 'open'
    ).length;
    if (activePeers > 0) {
      setDotPeer('green');
    } else {
      setDotPeer('yellow');
    }
  };

  // ── Inicialização do Componente ──
  useEffect(() => {
    addLog('Pronto para conexões em grupo. Configure o servidor e conecte-se.', 'info');
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(recTimerIntervalRef.current);
    };
  }, []);

  // ── Conexão Socket.io & WebRTC Multi-Peer ──
  const handleConnect = () => {
    const socket = io(srvUrl, { reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000 });
    socketRef.current = socket;
    setDotWs('yellow');
    addLog('Conectando ao sinalizador...', 'info');

    socket.on('connect', () => {
      setDotWs('green');
      addLog('Conectado ao servidor de sinalização!', 'success');
      socket.emit('join-room', { room, username });
      setDotRoom('green');
      addLog(`Você entrou como "${username}" no grupo: "${room}"`, 'success');
      setIsConnected(true);
    });

    socket.on('user-connected', async ({ id, username: pName }) => {
      peerNamesRef.current[id] = pName;
      setParticipants(prev => new Map(prev).set(id, pName));
      addLog(`${pName} entrou no grupo. Criando conexão direta...`, 'info');
      await initPeer(id, true);
    });

    socket.on('offer', async ({ offer, from, username: pName }) => {
      if (!offer) return;
      peerNamesRef.current[from] = pName;
      setParticipants(prev => new Map(prev).set(from, pName));
      addLog(`Conectando de forma direta com ${pName}...`, 'info');
      
      const pc = await initPeer(from, false);
      try {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { answer, to: from, room });
      } catch (err) {
        addLog(`Erro ao responder oferta: ${err.message}`, 'error');
      }
    });

    socket.on('answer', async ({ answer, from, username: pName }) => {
      if (pName) {
        peerNamesRef.current[from] = pName;
        setParticipants(prev => new Map(prev).set(from, pName));
      }
      const pc = peersRef.current[from];
      if (pc && answer) {
        try { await pc.setRemoteDescription(answer); }
        catch (err) { addLog(`Erro ao aplicar resposta: ${err.message}`, 'error'); }
      }
    });

    socket.on('candidate', async ({ candidate, from }) => {
      const pc = peersRef.current[from];
      if (pc && candidate) {
        try { await pc.addIceCandidate(candidate); }
        catch (err) { console.error('Erro ICE:', err); }
      }
    });

    socket.on('user-disconnected', ({ id, username: pName }) => {
      addLog(`${pName || 'Um participante'} saiu do grupo.`, 'warn');
      setParticipants(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      closePeerConnection(id);
      delete peerNamesRef.current[id];
      if (privateTarget === id) setPrivateTarget(null);
    });

    socket.on('disconnect', () => {
      setDotWs('red'); setDotRoom('red'); setDotPeer('red');
      addLog('Você foi desconectado.', 'error');
      setIsConnected(false);
      Object.keys(peersRef.current).forEach(closePeerConnection);
    });
  };

  const initPeer = async (userId, isInitiator) => {
    if (peersRef.current[userId]) closePeerConnection(userId);

    const pc = new RTCPeerConnection(RTC_CONFIG_FULL);
    peersRef.current[userId] = pc;

    if (isInitiator) {
      const dc = pc.createDataChannel('chat-group');
      setupDataChannel(userId, dc);
    } else {
      pc.ondatachannel = (event) => {
        setupDataChannel(userId, event.channel);
      };
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit('candidate', { candidate: e.candidate, to: userId });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        closePeerConnection(userId);
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit('offer', { offer, to: userId });
      } catch (err) { addLog(`Erro ao criar oferta para ${userId}`, 'error'); }
    }

    return pc;
  };

  const setupDataChannel = (userId, channel) => {
    dataChannelsRef.current[userId] = channel;

    channel.onopen = () => {
      addLog(`Conexão direta P2P estabelecida com ${peerNamesRef.current[userId] || userId} 🚀`, 'success');
      updatePeerStatusDot();
    };

    channel.onclose = () => {
      closePeerConnection(userId);
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          const senderRealName = peerNamesRef.current[userId] || "Membro do Grupo";

          if (msg.type === 'text') {
            setMessages(prev => [...prev, { id: Math.random(), type: 'text', sender: 'peer', senderName: senderRealName, data: msg.data }]);
          }

          if (msg.type === 'private') {
            setMessages(prev => [...prev, { id: Math.random(), type: 'private', sender: 'peer', senderName: senderRealName, data: msg.data }]);
          }

          if (msg.type === 'file-start') {
            fileTransfersRef.current[msg.transferId] = {
              chunks: [], received: 0, total: msg.size, name: msg.name, mimeType: msg.mimeType, senderId: userId
            };
            addLog(`Recebendo "${msg.name}" de ${senderRealName}...`, 'info');
          }

          if (msg.type === 'file-end') {
            const transfer = fileTransfersRef.current[msg.transferId];
            if (!transfer) return;
            const blob = new Blob(transfer.chunks, { type: transfer.mimeType });
            setMessages(prev => [...prev, {
              id: Math.random(), type: 'file', sender: 'peer', senderName: senderRealName, blob, name: transfer.name, mimeType: transfer.mimeType
            }]);
            addLog(`"${transfer.name}" recebido com sucesso!`, 'success');
            delete fileTransfersRef.current[msg.transferId];
          }
        } catch (e) { console.error(e); }
      } else {
        const activeTransfer = Object.values(fileTransfersRef.current).find(t => t.senderId === userId);
        if (activeTransfer) {
          activeTransfer.chunks.push(event.data);
          activeTransfer.received += event.data.byteLength;
        }
      }
    };
  };

  const closePeerConnection = (userId) => {
    if (dataChannelsRef.current[userId]) {
      dataChannelsRef.current[userId].close();
      delete dataChannelsRef.current[userId];
    }
    if (peersRef.current[userId]) {
      peersRef.current[userId].close();
      delete peersRef.current[userId];
    }
    updatePeerStatusDot();
  };

  // ── Lógica de Envio de Mensagens de Texto ──
  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    if (privateTarget) {
      const dc = dataChannelsRef.current[privateTarget];
      if (!dc || dc.readyState !== 'open') {
        addLog(`Não foi possível enviar: peer desconectado.`, 'error');
        return;
      }
      dc.send(JSON.stringify({ type: 'private', data: messageText }));
      setMessages(prev => [...prev, { id: Math.random(), type: 'private', sender: 'me', senderName: 'Você', data: messageText }]);
    } else {
      const packet = JSON.stringify({ type: 'text', data: messageText });
      let sent = 0;
      Object.values(dataChannelsRef.current).forEach(dc => {
        if (dc.readyState === 'open') { dc.send(packet); sent++; }
      });
      setMessages(prev => [...prev, { id: Math.random(), type: 'text', sender: 'me', senderName: 'Você', data: messageText }]);
      if (!sent) addLog('Nenhum peer conectado para receber a mensagem.', 'warn');
    }
    setMessageText('');
  };

  // ── Lógica de Transmissão de Arquivos e Mídias ──
  const handleSendFile = async (file) => {
    if (file.size > MAX_FILE_SIZE) {
      addLog(`"${file.name}" bloqueado — tamanho excede o limite de 100 MB.`, 'error');
      return;
    }

    const transferId = crypto.randomUUID();
    const arrayBuffer = await file.arrayBuffer();
    const openChannels = Object.values(dataChannelsRef.current).filter(dc => dc.readyState === 'open');

    if (openChannels.length === 0) {
      addLog('Nenhum peer conectado para receber o arquivo.', 'warn');
      return;
    }

    addLog(`Enviando "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`, 'info');

    const startMsg = JSON.stringify({ type: 'file-start', transferId, name: file.name, mimeType: file.type, size: file.size });
    const endMsg = JSON.stringify({ type: 'file-end', transferId });

    for (const dc of openChannels) {
      dc.send(startMsg);
      for (let offset = 0; offset < arrayBuffer.byteLength; offset += CHUNK_SIZE) {
        const chunk = arrayBuffer.slice(offset, offset + CHUNK_SIZE);
        while (dc.bufferedAmount > 1 * 1024 * 1024) {
          await new Promise(r => setTimeout(r, 20));
        }
        dc.send(chunk);
      }
      dc.send(endMsg);
    }

    const blob = new Blob([arrayBuffer], { type: file.type });
    setMessages(prev => [...prev, { id: Math.random(), type: 'file', sender: 'me', senderName: 'Você', blob, name: file.name, mimeType: file.type }]);
    addLog(`"${file.name}" enviado!`, 'success');
  };

  // ── Mecanismo de Gravação de Áudio/Vídeo ──
  const startRecording = async (mode) => {
    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(mode === 'video' ? { video: true, audio: true } : { audio: true });
      recStreamRef.current = stream;
    } catch (err) {
      addLog(`Erro ao acessar mídia: ${err.message}`, 'error');
      return;
    }

    recChunksRef.current = [];
    const mimeType = mode === 'video' 
      ? ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'].find(t => MediaRecorder.isTypeSupported(t))
      : ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm'].find(t => MediaRecorder.isTypeSupported(t));

    if (!mimeType) {
      addLog('Formato de gravação não suportado pelo navegador.', 'error');
      recStreamRef.current.getTracks().forEach(t => t.stop());
      return;
    }

    const recorder = new MediaRecorder(recStreamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) recChunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      recStreamRef.current.getTracks().forEach(t => t.stop());
      clearInterval(recTimerIntervalRef.current);
      setIsRecording(false);

      const blob = new Blob(recChunksRef.current, { type: mimeType });
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const file = new File([blob], `${mode}-${Date.now()}.${ext}`, { type: mimeType });
      
      await handleSendFile(file);
    };

    let seconds = 0;
    setIsRecording(true);
    setRecLabel(`${mode === 'video' ? '🎥 Gravando vídeo' : '🎤 Gravando áudio'} · 0s`);
    
    recTimerIntervalRef.current = setInterval(() => {
      seconds++;
      setRecLabel(`${mode === 'video' ? '🎥 Gravando vídeo' : '🎤 Gravando áudio'} · ${seconds}s`);
    }, 1000);

    recorder.start(100);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <>
      <Card>
        <CardTitle>Conexão</CardTitle>
        
        <StatusComponent 
          dotWs={dotWs} 
          dotRoom={dotRoom} 
          dotPeer={dotPeer} />

        <ConectionComponent 
          srvUrl={srvUrl}
          setSrvUrl={setSrvUrl}
          username={username}
          setUsername={setUsername}
          room={room}
          setRoom={setRoom}
          handleConnect={handleConnect}
          connectDisabled={isConnected} />

      </Card>

      {/* Seção Central de Mensagens e Participantes */}
      <Card>
        <CardTitle>Mensagens</CardTitle>
        <ContainerChat 
          messages={messages} 
          participants={participants} 
          username={username} 
          privateTarget={privateTarget} 
          setPrivateTarget={setPrivateTarget}
          />
      </Card>

      {/* Formulário Inferior de Envio */}
      <Card>
        <CardTitle>Enviar mensagem</CardTitle>
        <InputsChat
          participants={participants}
          privateTarget={privateTarget}
          setPrivateTarget={setPrivateTarget}
          messageText={messageText}
          setMessageText={setMessageText}
          handleSendMessage={handleSendMessage}
          handleSendFile={handleSendFile}
          fileInputRef={fileInputRef}
          isConnected={isConnected}
          isRecording={isRecording}
          startRecording={startRecording}
          recLabel={recLabel} />
      </Card>

      {/* Log */}
      <Card>
        <CardTitle>Log</CardTitle>
        <LogComponent logs={logs} onClear={() => setLogs([])} />
      </Card>
    </>
  );
}