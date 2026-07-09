import { Link } from 'react-router-dom';
import { Box, styled } from '@mui/material';

const ListUsersWrapper = styled(Box)(() => ({
  width: { 
    xs: '100%', 
    sm: '140px' 
  }, 
  flexShrink: 0,
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '8px 6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
  overflowY: 'auto',
  maxHeight: '300px' 
}));

export default function ChatListUsers({ participants, username, privateTarget, setPrivateTarget }) {

  /* Lista de Participantes Laterais */
  return (
    <ListUsersWrapper>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', padding: '2px 6px 6px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>Participantes</div>
      
      <Box onClick={() => setPrivateTarget(null)} className={`user-item ${!privateTarget ? 'active' : ''}`} sx={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 8px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text)', transition: 'background 0.15s', '&.active': { background: 'rgba(0, 229, 255, 0.12)', color: 'var(--accent)', fontWeight: 600 } }}>
        <span>👥</span><span>Todos</span>
      </Box>

      <Box className="user-item user-self" sx={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 8px', borderRadius: '7px', fontSize: '0.8rem', color: 'var(--text)', opacity: 0.5 }}>
        <span>🟢</span><span>{username} (Você)</span>
      </Box>

      {Array.from(participants.entries()).map(([id, name]) => (
        <Box key={id} onClick={() => setPrivateTarget(id)} className={`user-item ${privateTarget === id ? 'active' : ''}`} sx={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 8px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text)', '&.active': { background: 'rgba(0, 229, 255, 0.12)', color: 'var(--accent)', fontWeight: 600 } }}>
          <span>👤</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </Box>
      ))}
    </ListUsersWrapper>
  );
}