import crypto from "crypto";
import { WebSocket } from "ws";

interface WebSocketId extends WebSocket {
  id?: string;
}

let sessions: { [key: string]: Array<WebSocketId | number> } = {};

function generateSession(player: WebSocketId): string {
  let sessionId = crypto.randomBytes(3).toString("hex");
  player.id = sessionId + "1";
  sessions[sessionId] = [player];
  return sessionId;
}

function joinSession(json: any, player: WebSocketId) {
  const sessionId = json.sessionId;
  const oldSessionId = json.oldSessionId;
  if (
    sessionId != undefined &&
    oldSessionId != undefined &&
    sessionId.length == 6 &&
    oldSessionId.length == 6
  ) {
    const session = sessions[sessionId];
    if (session != undefined && session.length == 1) {
      deleteSession(oldSessionId);
      player.id = sessionId + "2";
      sessions[sessionId].push(player);
      startGame(sessionId);
    } else {
      player.send(JSON.stringify({ result: 400, error: "Wrong Session" }));
    }
  } else {
    player.send(JSON.stringify({ result: 400, error: "Wrong Json" }));
  }
}

function deleteSession(sessionId: string) {
  delete sessions[sessionId];
}

function startGame(sessionId: string) {
  let p1 = crypto.randomInt(2);
  let session = sessions[sessionId];

  let player1 = session[0] as WebSocketId;
  let player2 = session[1] as WebSocketId;

  if (p1 == 1) {
    player1.send(JSON.stringify({ result: 200 }));
    player2.send(JSON.stringify({ result: 201 }));
    sessions[sessionId].push(2);
  } else {
    player1.send(JSON.stringify({ result: 201 }));
    player2.send(JSON.stringify({ result: 200 }));
    sessions[sessionId].push(1);
  }
}

function play(json: any, player: WebSocketId) {
  const sessionId = json.sessionId;
  if (
    sessionId != undefined &&
    sessionId.length == 6 &&
    player.id != undefined &&
    sessions[sessionId] != undefined &&
    sessions[sessionId].length == 3
  ) {
    const session = sessions[sessionId];

    let player1 = session[0] as WebSocketId;
    let player2 = session[1] as WebSocketId;

    const currentTurn = session[2] as number;
    const playerTurn = Number.parseInt(player.id[6] as string);

    if (currentTurn == playerTurn && sessionId == player.id.slice(0, 6)) {
      if (currentTurn == 1) {
        player2.send(JSON.stringify({ error: false, number: json.bingo >= 5 ? -1 : json.number }));
        player1.send(JSON.stringify({ error: false, number: json.bingo >= 5 ? 0 : json.number }));
        sessions[sessionId][2] = 2;
      } else {
        player1.send(JSON.stringify({ error: false, number: json.bingo >= 5 ? -1 : json.number }));
        player2.send(JSON.stringify({ error: false, number: json.bingo >= 5 ? 0 : json.number }));
        sessions[sessionId][2] = 1;
      }
    } else {
      player.send(JSON.stringify({ error: true, response: "Wrong Turn or session" }));
    }
  } else {
    player.send(JSON.stringify({ error: true, respones: "Wrong Json or Id" }));
  }
}

export { play, joinSession, generateSession };
