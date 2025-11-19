import { Server } from "socket.io";
import { dbConnect } from "../lib/mongoose.ts";
import mongoose from "mongoose";
import Comment from "../models/Comment.ts";

let io: Server;
const { Schema, model, models } = mongoose;

interface IComment {
    id: number;
    post_id: number;
    user_uid: string;
    body: string;
}

export const initSocket = (server: any) => {
    // if (io) return io;

    const io = new Server(server, {
        cors: {
            origin: "http://localhost:4000", // הכתובת של ה-frontend שלך
        },
    });

    const CommentModel = Comment as unknown as Model<IComment>;

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("join_post", (postId: number) => {
            socket.join(postId.toString());
            console.log(`User joined post ${postId}`);
        });

        socket.on("new_comment", async (data) => {
            const { post_id, user_id, body } = data;

            await dbConnect();

            const lastComment = await CommentModel
                .findOne()
                .sort({ id: -1 })
                .lean();

            const nextId = (lastComment?.id ?? 0) + 1;

            const newComment = await CommentModel.create({
                id: nextId,
                post_id,
                user_id,
                body,
            });

            io.to(post_id.toString()).emit("new_comment", newComment);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};
