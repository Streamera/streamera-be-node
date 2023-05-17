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
dotenv.config({ path: path.join(__dirname, '.env')});

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

// serve assets like images / video / etc
app.use('/assets', express.static('public/content'));

//connect app to websocket
let http = createServer(app);
/* let io = new Server(http, {
    cors: {
        origin: whitelists,
        credentials: true
    }
}); */

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