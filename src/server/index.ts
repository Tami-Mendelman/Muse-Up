import express from "express";
import http from "http";
import { Server } from "socket.io";
import { initSocket } from "./socketIO.ts";
import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });

const app = express();
const server = http.createServer(app);

const io = initSocket(server);

server.listen(3001, () => {
    console.log("Socket.IO server running on port 3001");
});
