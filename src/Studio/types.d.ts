import { Server, Socket } from "socket.io";

export type StudioConstructor = {
    io: Server;
    socket: Socket;
    address: string;
    //deletes Studio
    onPromptDelete: () => void;
}
