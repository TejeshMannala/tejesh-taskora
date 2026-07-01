import { useSocketContext } from '../contexts/SocketContext';

const useSocket = () => {
  return useSocketContext();
};

export default useSocket;