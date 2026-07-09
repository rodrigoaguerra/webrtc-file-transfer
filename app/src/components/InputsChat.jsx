import { Link } from 'react-router-dom';
import { Box, styled } from '@mui/material';

const InputsWrapper = styled(Box)(() => ({
  display: 'grid', 
  gridTemplateColumns: '1fr auto', 
  gap: '.75rem', 
  alignItems: 'end' 
}));

export default function InputsChat({ participants, privateTarget, setPrivateTarget, messageText, setMessageText, handleSendMessage, handleSendFile, fileInputRef, isConnected, isRecording, startRecording, recLabel }) {
  return (
    <>
      <InputsWrapper>
        <div style={{ width: '100%' }}>
          {privateTarget && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent2)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
              <span>🔒 Para: <strong>{participants.get(privateTarget) || privateTarget}</strong></span>
              <button onClick={() => setPrivateTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px' }}>✕</button>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <input value={messageText} onChange={e => setMessageText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className={privateTarget ? 'private' : ''} style={{ borderColor: privateTarget ? 'var(--accent2)' : '', boxShadow: privateTarget ? '0 0 0 2px rgba(124,58,237,0.25)' : '' }} placeholder={privateTarget ? `Mensagem privada para ${participants.get(privateTarget)}...` : "Digite sua mensagem..."} disabled={!isConnected} />
            
            <button onClick={() => fileInputRef.current.click()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px' }} disabled={!isConnected} title="Anexar arquivos">
              📎
              <input type="file" ref={fileInputRef} onChange={e => handleSendFile(e.target.files[0])} style={{ display: 'none' }} />
            </button>

            <button onClick={() => startRecording('audio')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: isRecording ? '#ef4444' : 'var(--text)', borderRadius: '8px' }} disabled={!isConnected} title="Gravar Áudio">🎤</button>
            <button onClick={() => startRecording('video')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: isRecording ? '#ef4444' : 'var(--text)', borderRadius: '8px' }} disabled={!isConnected} title="Gravar Vídeo">🎥</button>
            
            <button className="btn btn-primary" onClick={handleSendMessage} disabled={!isConnected} style={{ padding: '.65rem 1.4rem', border: 'none', borderRadius: '8px', fontWeight: 600, background: 'linear-gradient(135deg, var(--accent2), var(--accent))', color: '#fff' }}>Enviar</button>
          </Box>

          {isRecording && (
            <Box sx={{ display: 'flex', marginTop: '6px', fontSize: '12px', color: '#ef4444', fontFamily: 'var(--font-mono)', alignItems: 'center', gap: '6px' }}>
              <span style={{ animation: 'blink 1s infinite' }}>⏺</span>
              <span>{recLabel}</span>
            </Box>
          )}
        </div>
      </InputsWrapper>
      {!isConnected && <p style={{ margin: '10px 0 0', color: '#6b7280', fontSize: '0.95rem' }}>Conecte-se a uma sala para começar a conversar.</p>}
    </>
  );
}