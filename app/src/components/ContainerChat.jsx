import { Link } from 'react-router-dom';
import { Box, styled } from '@mui/material';
import ChatListUsers from './ChatListUsers';
import ChatMessages from './ChatMessages';

const ContainerWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '10px',
  alignItems: 'stretch',
  flexDirection: 'column',
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row',
  },
}));

export default function ContainerChat({ messages, participants, username, privateTarget, setPrivateTarget }) {
  return (
    <ContainerWrapper>   
      {/* Lista de Participantes Laterais */}
      <ChatListUsers 
        participants={participants} 
        username={username} 
        privateTarget={privateTarget} 
        setPrivateTarget={setPrivateTarget}
        />

      {/* Container das Mensagens */}
      <ChatMessages
        messages={messages}
        />
    </ContainerWrapper>
  );
}