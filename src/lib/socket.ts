import { io, Socket } from "socket.io-client";
import "react-native-url-polyfill/auto";

let socket: Socket | null = null;

export const createSocket = (userId?: string) => {
  if (socket?.connected) return socket;

  if (socket) {
    socket.connect();
    return socket;
  }

  console.log("Creating new socket connection with userId:", userId);
  socket = io("http://192.168.1.23:3001", {
    transports: ["websocket"],
    autoConnect: true,
    auth: userId ? { userId } : undefined,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("Socket connected successfully:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};
