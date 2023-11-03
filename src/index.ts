import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { generateSession, joinSession, play } from "./logic";

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8099;

app.use(express.json());

app.use(cors());

const server = app.listen(PORT, () => console.log("Runnig: " + PORT + "\nHello Bingo Backend"));

const wsServer = new WebSocketServer({ server: server });

wsServer.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    const json = JSON.parse(data.toString());
    const state = json.state;

    if (state != undefined) {
      if (state == 1) {
        play(json, ws);
      } else if (state == 0) {
        joinSession(json, ws);
      }
    } else {
      ws.send(JSON.stringify({ error: true, response: "Wrong State" }));
    }
  });

  let sessionId = generateSession(ws); // ok
  ws.send(sessionId);
});

