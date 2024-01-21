import path from 'path';

import { logger, matchMaker } from '@colyseus/core';
import { monitor } from '@colyseus/monitor';
import { playground } from '@colyseus/playground';
import config from '@colyseus/tools';
import express from 'express';
import basicAuth from 'express-basic-auth';
import { RoomType } from '@tft-roller';

import { GameRoom, PublicLobbyRoom } from './rooms';

export default config({
  initializeGameServer: (gameServer) => {
    // matchMaker.controller.exposedMethods = ['join', 'joinById', 'reconnect'];

    gameServer.define(RoomType.Game, GameRoom).enableRealtimeListing();
    gameServer.define(RoomType.Lobby, PublicLobbyRoom);
  },

  initializeExpress: (app) => {
    if (!process.env.ADMIN_PASSWORD) {
      throw new Error('process.env.ADMIN_PASSWORD is not set');
    }

    const basicAuthMiddleware = basicAuth({
      users: {
        admin: process.env.ADMIN_PASSWORD,
      },
      challenge: true,
    });

    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    app.get('/health', (_, res) => {
      res.status(200).send();
    });

    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */
    if (process.env.NODE_ENV !== 'production') {
      app.use('/', playground);
    } else {
      app.use(
        '/',
        express.static(
          path.join(__dirname, '../../../../tft-roller-client/build'),
        ),
      );
    }

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    app.use('/colyseus', basicAuthMiddleware, monitor());
  },

  beforeListen: async () => {
    const lobby = await matchMaker.createRoom(RoomType.Lobby, {});
    logger.info('lobby created', lobby);
  },
});
