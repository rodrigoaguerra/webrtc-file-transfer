import { Box, Button, styled } from '@mui/material';

const ActionsWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '.6rem',
  flexWrap: 'wrap', 
  marginTop: '.9rem' 
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: '.65rem 1.4rem',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: '.85rem',
  textTransform: 'none',
  backgroundColor: 'rgba(255,255,255,.08)',
  color: 'var(--text)',
  '&:hover': { backgroundColor: 'rgba(255,255,255,.12)' },
  '&:disabled': { opacity: 0.4, color: 'var(--text)' },
  '&.btn-primary': {
    background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
    color: '#fff',
    '&:disabled': { opacity: 0.4, color: '#fff' },
  },
  '&.btn-danger': {
    border: 'none',
    backgroundColor: 'var(--red)',
    color: '#fff',
    '&:disabled': { opacity: 0.4, color: '#fff' },
  }
}));

export default function ActionsComponent({
  cameraDisabled,
  callDisabled,
  hangupDisabled,
  handleStartCamera,
  handleCall,
  handleHangup,
}) {
  return (
    <ActionsWrapper>
      <StyledButton
        disabled={cameraDisabled}
        onClick={handleStartCamera}
      >
        📷 Câmera
      </StyledButton>

      <StyledButton
        className="btn-primary"
        disabled={callDisabled}
        onClick={handleCall}
      >
        📞 Ligar
      </StyledButton>

      <StyledButton
        className="btn-danger"
        disabled={hangupDisabled}
        onClick={handleHangup}
      >
        🔴 Desligar
      </StyledButton>
    </ActionsWrapper>
  );
}
