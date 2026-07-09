import { Link } from 'react-router-dom';
import { Box, styled } from '@mui/material';
import ChatListUsers from './ChatListUsers';

const ContainerMessagesWrapper = styled(Box)(() => ({
  height: '300px',
  width: '100%',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  padding: '0.5rem',
  background: 'rgba(0, 0, 0, 0.2)',
  borderRadius: '6px',
  border: '1px solid var(--border)'  
}));

export default function ChatMessages({ messages }) {

  const now = () => new Date().toLocaleTimeString('pt-BR', { hour12: false });

  const renderMessageContent = (msg) => {
    if (msg.type === 'text' || msg.type === 'private') {
        return <p style={{ margin: 0 }}>{msg.data}</p>;
    }
  
    const url = URL.createObjectURL(msg.blob);
    if (msg.mimeType.startsWith('image/')) {
      return <img src={url} alt={msg.name} style={{ maxWidth: '220px', maxHeight: '200px', borderRadius: '8px', display: 'block', marginTop: '6px', cursor: 'pointer' }} onClick={() => window.open(url)} />;
    } else if (msg.mimeType.startsWith('video/')) {
      return <video src={url} controls style={{ maxWidth: '260px', borderRadius: '8px', display: 'block', marginTop: '6px' }} />;
    } else if (msg.mimeType.startsWith('audio/')) {
      return <audio src={url} controls style={{ maxWidth: '260px', borderRadius: '8px', display: 'block', marginTop: '6px' }} />;
    } else {
      return <a href={url} download={msg.name} style={{ color: '#7eb8f7', display: 'block', marginTop: '4px' }}>📥 {msg.name}</a>;
    }
  };

  {/* Container das Mensagens */}
  return (
    <ContainerMessagesWrapper>
      {messages.map(msg => (
        <Box key={msg.id} sx={{ display: 'flex', width: '100%', justifyContent: msg.sender === 'me' ? 'flex-end' : 'flex-start' }}>
          <Box sx={{ maxWidth: '75%', padding: '0.6rem 0.9rem', borderRadius: '12px', fontSize: '0.9rem', lineHeight: 1.4, position: 'relative', wordBreak: 'break-word', background: msg.sender === 'me' ? 'linear-gradient(135deg, var(--accent2), rgba(124, 58, 237, 0.6))' : 'var(--border)', color: msg.sender === 'me' ? '#fff' : 'var(--text)', borderBottomRightRadius: msg.sender === 'me' ? '2px' : '12px', borderBottomLeftRadius: msg.sender === 'peer' ? '2px' : '12px' }}>
            {msg.type === 'private' && <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.5)', borderRadius: '5px', padding: '1px 5px', marginBottom: '4px', letterSpacing: '.05em' }}>🔒 PRIVADO</span>}
            <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: msg.sender === 'me' ? 'var(--yellow)' : 'var(--accent)', textAlign: msg.sender === 'me' ? 'right' : 'left', marginBottom: '0.15rem' }}>{msg.senderName}</span>
            {renderMessageContent(msg)}
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{now()}</span>
          </Box>
        </Box>
      ))}
    </ContainerMessagesWrapper>
  );
}