import { io } from "socket.io-client";
import "react-native-url-polyfill/auto";

export const createSocket = (userId?: string) => {
  const socket = io("http://192.168.1.23:3001", {
    transports: ["websocket"],
    autoConnect: true,
    auth: userId ? { userId } : undefined,
  });

  socket.on("connect", () => {
    console.log("Connected to socket server");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};
