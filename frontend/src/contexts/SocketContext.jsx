import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const SocketContext = createContext();

export const useSocketContext = () => useContext(SocketContext);

let loggedSockets = new Set();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (socketRef.current?.connected) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      forceNew: false,
    });

    socket.on('connect', () => {
      loggedSockets.add(socket.id);
    });

    socket.on('disconnect', (reason) => {
      loggedSockets.delete(socket.id);
    });

    socket.on('connect_error', (err) => {
      if (err.message === 'Invalid token' || err.message === 'Authentication required') {
        socket.disconnect();
        dispatch(logout());
      }
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        loggedSockets.delete(socketRef.current.id);
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, isAuthenticated, dispatch]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};
