import { Server, Socket } from "socket.io";
import { StudioConstructor } from "./types";
import * as userController from '../Users/index';
import * as leaderboardController from '../Leaderboards/index';
import * as milestoneController from '../Milestones/index';
import * as pollController from '../Polls/index';
import * as qrController from '../QR/index';
import * as announcementController from '../Announcements/index';

export class Studio {
    io: Server;
    client: Socket;
    room: string;
    stream_id: number = 0;
    address: string;
    onPromptDelete;
    user: number = 0;

    constructor({ io, socket, address, onPromptDelete }: StudioConstructor) {
        this.io = io;
        this.client = socket;
        this.room = `studio_${address}`;
        this.address = address;
        this.onPromptDelete = onPromptDelete;
    }

    init = async() => {
        const user = await userController.find({ wallet: this.address });
        // valid user
        if (user.length > 0) {
            this.user = user[0].id!;
            await this.client.join(this.room);

            // // Listen for the disconnect event
            // this.client.on('disconnect', () => {
            //     // Remove the socket from the room
            //     console.log(`${this.address} dced`);
            //     this.client.leave(this.room);
            //     this.onPromptDelete();
            // });
        }
    }

    start = async() => {
        const data = {
            leaderboard: await leaderboardController.find({ user_id: this.user }),
            milestone: await milestoneController.find({ user_id: this.user }),
            poll: await pollController.find({ user_id: this.user }),
            qr: await qrController.find({ user_id: this.user }),
            announcement: await announcementController.find({ user_id: this.user }),
        };


        const res = this.io.to(this.room).emit('init', JSON.stringify(data));
        console.log(`res: ${res}`);
        // this.client.emit('test', 'hello');
    }
}