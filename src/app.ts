import express, { Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import router from "./routes/routes";
import { Server } from "socket.io";
import morgan from "morgan";
import { errorMiddleware } from "./middleware/error.middleware";
import { startMessageScheduler } from "./utils/message.scheduler";
import useSocket from "./sockets";
import path from "path";
import http from "http";
const app = express();
const server = http.createServer(app);

const io = new Server(server);
const { getUser } = useSocket(io);
startMessageScheduler(io , getUser as any );

app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/v1", router);

app.use("*", async (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);
export default server;
