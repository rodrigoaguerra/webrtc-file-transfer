import { Link } from 'react-router-dom';
import { Box, Typography, styled, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const HeaderWrapper = styled(Box)(({ theme }) => ({  
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between', // Empurra a esquerda e direita pros cantos
  
  // Agrupa o ícone e os textos à esquerda
  '& .left-section': {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },

  '& .logo': {
    width: '44px', 
    height: '44px',
    background: 'linear-gradient(135deg, var(--accent2), var(--accent))', //
    borderRadius: '12px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '1.4rem'
  },
  '& h1': {
    fontSize: '1.3rem',
    fontWeight: 600,
    letterSpacing: '-.02em',
    color: 'var(--text)' // Garante que a cor do texto siga seu tema
  },
  '& p': {
    fontSize: '.8rem',
    color: 'var(--muted)',
    margin: 0 // Remove margens padrões do parágrafo para melhor alinhamento
  },
  // Estilização do botão de voltar combinando com seus inputs/cards
  '& .back-button': {
    color: 'var(--text)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '8px',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'var(--accent)',
      color: 'var(--accent)',
    }
  },
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '.75rem',
    '& .back-button': {
      alignSelf: 'flex-end'
    }
  }
}));

export default function HeaderComponent({ icon, title, description }) { //[cite: 2]
  return (
    <HeaderWrapper>
      {/* Container da Esquerda */}
      <div className="left-section">
        <div className="logo">{icon}</div>
        <div>
          <Typography variant="h1">{title}</Typography>
          <p>{description}</p>
        </div>
      </div>

      {/* Botão da Direita (Voltar) */}
      <IconButton 
        component={Link} 
        to="/" 
        className="back-button"
        aria-label="Voltar para a página inicial"
      >
        <ArrowBackIcon />
      </IconButton>
    </HeaderWrapper>
  );
}