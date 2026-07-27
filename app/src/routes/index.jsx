import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';

const Home = lazy(() => import('../pages/Home'));
const VideoPage = lazy(() => import('../pages/VideoPage'));
const TransferPage = lazy(() => import('../pages/TransferPage'));
const ChatPage = lazy(() => import('../pages/ChatPage'));
const GamePage = lazy(() => import('../pages/GamePage'));

export const router = createBrowserRouter([
  { 
    path: '/', 
    element: <RootLayout />, // O Layout envolve todas as rotas
    children: [
      { 
        index: true, // 'index: true' significa que vai renderizar na raiz ('/') 
        element: <Home /> 
      },
      { 
        path: 'video', 
        element: <VideoPage />, 
        handle: { 
          icon: '📹', 
          title: 'WebRTC · Chamada de Vídeo', 
          description: 'Node.js Socket.IO backend · React.js Socket.IO frontend' 
        } 
      },
      { 
        path: 'transfer', 
        element: <TransferPage />,
        handle: { 
          icon: '📁', 
          title: 'WebRTC · Transferência P2P', 
          description: 'Node.js Socket.IO backend · React.js Socket.IO frontend' 
        } 
      },
      { 
        path: 'chat', 
        element: <ChatPage />, 
        handle: { 
          icon: '💬', 
          title: 'WebRTC · Chat Peer-to-Peer', 
          description: 'Node.js Socket.IO backend · React.js Socket.IO frontend' 
        } 
      },
      {
        path: 'game',
        element: <GamePage />,
        handle: {
          icon: '🎮',
          title: 'WebRTC · Jogo P2P',
          description: 'Node.js Socket.IO backend · React.js Socket.IO frontend'
        }
      }
    ]
  }
]);