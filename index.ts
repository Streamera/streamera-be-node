import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Socket, Server } from 'socket.io';
import cors from 'cors';import _ from 'lodash';
import path from 'path';
import dotenv from 'dotenv';
import { routes as userRoutes } from './src/Routes/users';
import { routes as paymentRoutes } from './src/Routes/payments';
import { routes as streamRoutes } from './src/Routes/streams';
import { routes as qrRoutes } from './src/Routes/qr';
import { routes as triggerRoutes } from './src/Routes/triggers';
import { routes as announcementRoutes } from './src/Routes/announcements';
import { routes as leaderboardRoutes } from './src/Routes/leaderboards';
import { routes as milestoneRoutes } from './src/Routes/milestones';
import { routes as pollRoutes } from './src/Routes/polls';
import { routes as webhookRoutes } from './src/Routes/webhooks';
dotenv.config({ path: path.join(__dirname, '.env')});
import { instrument } from '@socket.io/admin-ui';
import { Studio } from './src/Studio';

process.on('uncaughtException', function (err) {
    //dont stop on uncaught exception
    console.log('Caught exception: ', err);
});

//create app
const port = 8081;
const whitelists = JSON.parse(process.env.CORS_WHITELIST!);

let app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    origin: whitelists,
    credentials: true
}));

// include all the routes
app.use('/user', userRoutes);
app.use('/payment', paymentRoutes);
app.use('/stream', streamRoutes);
app.use('/qr', qrRoutes);
app.use('/trigger', triggerRoutes);
app.use('/announcement', announcementRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/milestone', milestoneRoutes);
app.use('/poll', pollRoutes);
app.use('/webhooks', webhookRoutes);

// serve assets like images / video / etc
app.use('/assets', express.static('public/content'));

//connect app to websocket
let http = createServer(app);
let io = new Server(http, {
    cors: {
        origin: whitelists,
        credentials: true
    }
});

export { io }; // Export the io instance

//websocket functions
io.on('connection', (socket: Socket) => {
    console.log(`A client connected`);

    let studio: Studio | null = null;
    let onPromptDelete = () => {
        studio = null;
        // console.log('room destroyed');
    };

    socket.on('start_studio', async({ address }) => {
        console.log(`${address} connected`);
        if( !address ) {
            socket.emit("invalid login");
            return;
        }

        try {
            studio = new Studio({io, socket, address, onPromptDelete});
            await studio.init();
        } catch (e){
            // do nothing
        }
    });

});

instrument(io, {
    auth: false
    // {
    //   type: "basic",
    //   username: "admin",
    //   password: "$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS" // "changeit" encrypted with bcrypt
    // },
});

//websocket functions
/* io.on('connection', (socket: Socket) => {

}); */

//api endpoints
app.get('/', function(req, res) {
    res.send('Hello World');
});

// start the server
http.listen(port, () => {
    console.log("I'm alive!");
});