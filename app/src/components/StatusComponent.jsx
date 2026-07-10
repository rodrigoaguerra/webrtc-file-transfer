import { Link } from 'react-router-dom';
import { Box, styled } from '@mui/material';

const StatusWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '.75rem',
  flexWrap: 'wrap',
  float: 'right',
  marginTop: '-2.5rem',
  [theme.breakpoints.down('md')]: {
    gap: '.65rem',
  }
}));

const Badge = styled('span')(({ theme, state }) => {
  const colors = { red: 'var(--red)', yellow: 'var(--yellow)', green: 'var(--green)', muted: 'var(--muted)' };
  const color = colors[state] || 'var(--border)';
  return {
    display: 'flex;', 
    alignItems: 'center', 
    gap: '.45rem',
    fontSize: '.78rem',
    fontWeight: 500,
    background: 'rgba(255,255,255,.04)',
    border: `1px solid ${color}`,
    borderRadius: '999px',
    padding: '.3rem .8rem',
    [theme.breakpoints.down('md')]: {
      fontSize: '.7rem',
      padding: '.2rem .6rem',
    }
  }
});  


const Dot = styled('span')(({ state }) => {
  const colors = { red: 'var(--red)', yellow: 'var(--yellow)', green: 'var(--green)', muted: 'var(--muted)' };
  const color = colors[state] || colors.muted;
  return {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: color,
    boxShadow: state !== 'muted' && state !== 'red' ? `0 0 6px ${color}` : 'none',
    transition: 'background .3s',
    display: 'inline-block',
    animation:  state === 'muted' ? 'none' : 'pulse 2s infinite',
  };
});

export default function StatusComponent({ dotWs, dotRoom, dotPeer }) {
  return (
    <StatusWrapper>
      <Badge state={dotWs}>
        <Dot state={dotWs} /> Signaling
      </Badge>
      <Badge state={dotRoom}>
        <Dot state={dotRoom} /> Room
      </Badge>
      <Badge state={dotPeer}>
        <Dot state={dotPeer} /> Peer
      </Badge>
    </StatusWrapper>
  );
}