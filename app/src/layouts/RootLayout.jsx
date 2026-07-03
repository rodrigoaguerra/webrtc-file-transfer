import { Outlet, useMatches } from 'react-router-dom';
import { Box, Typography, styled } from '@mui/material';
import HeaderComponent from '../components/HeaderComponent';

// ── Estilização compartilhada entre VideoPage / TransferPage / ChatPage ──
export const PageWrapper = styled(Box)(() => ({
  '--bg': '#0b0f1a',
  '--surface': '#111827',
  '--border': '#1e2a3a',
  '--accent': '#00e5ff',
  '--accent2': '#7c3aed',
  '--green': '#22c55e',
  '--red': '#ef4444',
  '--yellow': '#facc15',
  '--text': '#e2e8f0',
  '--muted': '#64748b',
  '--font-mono': '"JetBrains Mono", "Fira Code", monospace',
  '--font-body': '"DM Sans", sans-serif',
  '--radius': '10px',

  fontFamily: 'var(--font-body)',
  color: 'var(--text)',
  maxWidth: '960px',
  margin: '0 auto',
  padding: '2rem 1rem',
  display: 'grid',
  gap: '1.5rem',

  '& *': { boxSizing: 'border-box' },
  '& input': {
    width: '100%',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '.6rem .9rem',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    fontSize: '.85rem',
    outline: 'none',
    transition: 'border-color .2s',
    '&:focus': { borderColor: 'var(--accent)' }
  }
}));

export const Card = styled(Box)({
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '1.5rem',
});

export const CardTitle = styled(Typography)({
  fontSize: '.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '.1em',
  color: 'var(--muted)',
  marginBottom: '1rem',
});


export default function RootLayout({ }) {
  // Pega todas as rotas ativas no momento
  const matches = useMatches();
  
  // A última rota do array é sempre a rota filha atual (ex: /video)
  const currentRoute = matches[matches.length - 1];
  
  // Pega os dados do handle (ou um objeto vazio se não tiver)
  const routeData = currentRoute.handle || null;

  return (
    <PageWrapper>
      {routeData && <HeaderComponent 
        icon={routeData.icon}
        title={routeData.title} 
        description={routeData.description || "Node.js Socket.IO backend · React.js Socket.IO frontend"} 
        />}

      {/* O Outlet renderiza a página da rota atual */}
      <Outlet />
    </PageWrapper>
  );
}