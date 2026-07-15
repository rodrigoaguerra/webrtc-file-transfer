import { useRef,useEffect } from 'react';
import { Box, styled } from '@mui/material';

const LogWrapper = styled(Box)(({ theme }) => ({
  background: '#070b14',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '.75rem',
  height: '180px',
  overflowY: 'auto',
  fontFamily: 'var(--font-mono)',
  fontSize: '.8rem',
  lineHeight: 1.6,

  scrollbarWidth: 'thin',
  scrollbarColor: 'var(--border) transparent',

  '&::-webkit-scrollbar': {
    width: '5px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'var(--border)',
    borderRadius: '4px',
  },

  '& .log-line': {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '.4rem',
    marginBottom: '.25rem',
  },

  '& .log-time': {
    color: 'var(--muted)',
    fontSize: '.65rem',
    minWidth: '55px',
    flexShrink: 0,
  },

  '& .log-icon': {
    flexShrink: 0,
  },

  '& .log-msg': {
    color: 'var(--text)',
    wordBreak: 'break-word',
  },

  '& .log-msg.success': { color: 'var(--green)' },
  '& .log-msg.error': { color: 'var(--red)' },
  '& .log-msg.warn': { color: 'var(--yellow)' },
  '& .log-msg.info': { color: 'var(--accent)' },
  '& .log-msg.send': { color: 'var(--yellow)' },
  '& .log-msg.receive': { color: 'var(--green)' },

  // 📱 MOBILE
  [theme.breakpoints.down('sm')]: {
    height: '140px',
    fontSize: '.75rem',
    padding: '.6rem',

    '& .log-line': {
      flexDirection: 'column',
      gap: '2px',
    },

    '& .log-time': {
      fontSize: '.6rem',
      minWidth: 'auto',
    },

    '& .log-icon': {
      display: 'none', // economiza espaço
    },
  },
}));

export default function LogComponent({ logs, onClear }) {
  const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️', send: '📦', receive: '📥' };

  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const clearLogs = () => onClear();
    window.addEventListener('beforeunload', clearLogs);
    return () => {
      window.removeEventListener('beforeunload', clearLogs);
    };
  }, [onClear]);

  return (
    <LogWrapper ref={logRef}>
      {logs.map(log => (
        <div className="log-line" key={log.id}>
          <span className="log-time">{log.time}</span>
          <span className="log-icon">{icons[log.type] || '·'}</span>
          <span className={`log-msg ${log.type}`}>{log.msg}</span>
        </div>
      ))}
    </LogWrapper>
  );
}