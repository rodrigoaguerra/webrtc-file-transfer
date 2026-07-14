import { useEffect, useState } from 'react';
import { Box, styled } from '@mui/material';

const TransferWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  gap: 0,
  '& .sendQueueContainer, & .receiveQueueContainer': {
    position: 'relative',
    width: '50%',    
    flexShrink: 0,
    minWidth: 0,
    padding: '20px',
    border: '1px solid #ccc',
    boxSizing: 'border-box'
  },
  '& #emptySendQueue, & #emptyReceiveQueue': {
    textAlign: 'center',
    margin: '10px 0 0',
    color: '#6b7280',
    minHeight: '100%',
    fontSize: '0.95rem'
  },

  /** Mobile */
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    '& .sendQueueContainer, & .receiveQueueContainer': {
      width: '100%',
      padding: '10px'
    }
  },
}));

const QueueWrapper = styled(Box)(() => ({
  position: 'relative', // 👈 ESSENCIAL
  width: '100%',
  height: '100%',
}));

const FileQueue = styled('ul')(({ theme }) => ({
  listStyle: 'none',
  padding: 0,
  margin: '20px auto',
  maxWidth: '480px',
  maxHeight: '300px',
  textAlign: 'left',
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: 'var(--border) transparent',

  '& li': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '6px',
    background: 'rgba(255,255,255,.05)',
    fontSize: '14px',
    transition: 'background 0.2s'
  },
  
  /* Estados do item na fila */  
  '& li.status-pending ': { borderLeft: '4px solid #999' },
  '& li.status-active  ': { borderLeft: '4px solid #2196F3', background: 'rgba(33, 150, 243, 0.1)' },
  '& li.status-finalizing': { borderLeft: '4px solid #FFC107', background: 'rgba(255, 193, 7, 0.1)' },
  '& li.status-done    ': { borderLeft: '4px solid #4CAF50', background: 'rgba(76, 175, 80, 0.1)' },
  '& li.status-error   ': { borderLeft: '4px solid #f44336', background: 'rgba(244, 67, 54, 0.1)' },

  '& .file-name': {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  '& .file-size': {
    color: '#666',
    fontSize: '12px',
    whiteSpace: 'nowrap'
  },

  '& .file-icon': {
    fontSize: '18px',
  },

  '& .file-progress-bar-wrap': {
    width: '100%',
    height: '4px',
    background: '#ddd',
    borderRadius: '2px',
    overflow: 'hidden',
  },

  '& .file-progress-bar': {
    height: '100%',
    background: '#2196F3',
    borderRadius: '2px',
    transition: 'width 0.15s linear',
    width: '0%',
  },

  '& li.status-done .file-progress-bar': { background: '#4CAF50', width: '100%' },
  '& li.status-error .file-progress-bar': { background: '#f44336' },
}));

const ConfirmContainer = styled(Box)(({ theme }) => ({
  display: 'none',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: '10px',
  padding: '15px',
  background: 'rgba(255,255,255,.05)',
  border: '2px solid #4CAF50',
  borderRadius: '8px',
  margin: '10px 0',

  /** Sobrepor div de fila **/
  position: 'absolute',
  top: '25%',
  left: '50%',
  transform: 'translate(-50%, -25%)',
  width: '80%',
  maxWidth: '500px',
  textAlign: 'center',
  background: 'white', /* ou a cor de fundo do seu tema, para não ficar transparente sobre a lista */
  color: 'black',
  zIndex: 10,

  '& .btn-confirm': {
    backgroundColor: '#4CAF50', 
    color: 'white', 
    padding: '10px 20px', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer'
  },
}));

export default function TransferComponent({
  sendQueue,
  receiveQueue,
  sendCountText,
  receiveCountText,
  showSendConfirm,
  showAcceptConfirm,
  totalSendSize,
  totalReceiveSize,
  acceptBtnText,
  acceptDisabled,
  receiveAcceptFiles,
  handleSendFiles,
  handleAcceptFiles
}) {
  
  const icons = { pending: '📄', active: '🔄', finalizing: '💾', done: '✅', error: '❌' };
  
  return (
    <TransferWrapper> 
      {/* Fila Envio */}
      <Box className="sendQueueContainer">
        <h3>📦 Fila de Envio / <small>{sendCountText}</small></h3>
        {sendQueue.size === 0 && <p id="emptySendQueue">Nenhum arquivo na fila</p>}
        <QueueWrapper>
          <FileQueue>
            {Array.from(sendQueue.values()).map(item => (
              <li key={item.id} className={`status-${item.status}`}>
                <span className="file-icon">{icons[item.status]}</span>
                <span className="file-name" title={item.name}>{item.name}</span>
                <span className="file-size">{item.sizeText}</span>
                <div className="file-progress-bar-wrap">
                  <div className="file-progress-bar" style={{ width: `${item.progress}%`, backgroundColor: item.status === 'done' ? '#4CAF50' : '#2196F3' }}></div>
                </div>
              </li>
            ))}
          </FileQueue>
          {showSendConfirm && (
            <ConfirmContainer sx={{ display: 'flex !important' }}>
              <p>📦 Confirmar envio de arquivos:</p>
              <p><strong>Tamanho Total:</strong> {totalSendSize}</p>
              <button className="btn-confirm" onClick={() => handleSendFiles(Date.now())}>Enviar arquivos</button>
            </ConfirmContainer>
          )}
        </QueueWrapper>
      </Box>

      {/* Fila Recebimento */}
      <Box className="receiveQueueContainer">
        <h3>📥 Fila de Recebimento / <small>{receiveCountText}</small></h3>
        {receiveQueue.size === 0 && <p id="emptyReceiveQueue">Nenhum arquivo na fila</p>}
        <QueueWrapper>
          <FileQueue>
            {Array.from(receiveQueue.values()).map(item => (
              <li key={item.id} className={`status-${item.status}`}>
                <span className="file-icon">{icons[item.status]}</span>
                <span className="file-name" title={item.name}>{item.name}</span>
                <span className="file-size">{item.sizeText}</span>
                <div className="file-progress-bar-wrap">
                  <div className="file-progress-bar" style={{ width: `${item.progress}%`, backgroundColor: item.status === 'done' ? '#4CAF50' : '#2196F3' }}></div>
                </div>
              </li>
            ))}
          </FileQueue>
          {showAcceptConfirm && (
            <ConfirmContainer sx={{ display: 'flex !important' }}>
              <p>📥 Confirmar o recebimento de arquivos:</p>
              <p><strong>Tamanho Total:</strong> {totalReceiveSize}</p>
              <button className="btn-confirm" onClick={handleAcceptFiles} disabled={acceptDisabled}>{acceptBtnText}</button>
            </ConfirmContainer>
          )}
        </QueueWrapper>
      </Box>
    </TransferWrapper>
  );
}