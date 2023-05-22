import { Server, Socket } from "socket.io";
import { StudioConstructor } from "./types";
import * as userController from '../Users/index';
import * as leaderboardController from '../Leaderboards/index';
import * as milestoneController from '../Milestones/index';
import * as pollController from '../Polls/index';
import * as qrController from '../QR/index';
import * as announcementController from '../Announcements/index';
import * as triggerController from '../Triggers/index';
import _ from 'lodash';
import { convertBigIntToString } from "../../utils";
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
        if (user.length === 0) {
            throw Error("Invalid users");
        } else {
            this.user = user[0].id!;
            await this.client.join(this.room);

            // IMPORTANT: time spent 6hr+
            // must convert bigint to string, else JSON.stringify will have issue
            // socket also can't send the data

            let data = convertBigIntToString({
                leaderboard: await leaderboardController.find({ user_id: this.user }),
                milestone: await milestoneController.find({ user_id: this.user }),
                poll: await pollController.find({ user_id: this.user }),
                qr: await qrController.find({ user_id: this.user }),
                announcement: await announcementController.find({ user_id: this.user }),
                trigger: await triggerController.find({ user_id: this.user })
            });

            // only take the first result from each property
            _.map(data, (props, table) => {
                data[table] = props?.[0];
            });
            this.io.to(this.room).emit('update', data);
        }
    }
}