import path from 'path';

import { auth as colyseusAuth } from '@colyseus/auth';
import { logger, matchMaker } from '@colyseus/core';
import { monitor } from '@colyseus/monitor';
import { playground } from '@colyseus/playground';
import config from '@colyseus/tools';
import express from 'express';
import basicAuth from 'express-basic-auth';
import { RoomType } from '@tft-roller';

import * as api from './api';
import * as auth from './auth';
import * as rooms from './rooms';

export default config({
  initializeGameServer: (gameServer) => {
    matchMaker.controller.exposedMethods = ['join', 'joinById', 'reconnect'];

    gameServer.define(RoomType.Game, rooms.GameRoom).enableRealtimeListing();
    gameServer.define(RoomType.Lobby, rooms.PublicLobbyRoom);
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

    app.use(
      colyseusAuth.prefix,
      colyseusAuth.routes({
        onRegisterAnonymously: auth.onRegisterAnonymously,
      }),
    );

    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    app.get('/health', (_, res) => {
      res.status(200).send();
    });

    app.post('/games', colyseusAuth.middleware(), api.createGame);

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    app.use('/colyseus', basicAuthMiddleware, monitor());

    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */
    if (process.env.NODE_ENV !== 'production') {
      app.use('/', playground);
    } else {
      const staticRoot = path.join(
        __dirname,
        '../../../../tft-roller-client/build',
      );
      app.use('/', express.static(staticRoot));

      app.use(api.historyApiFallback(staticRoot));
    }
  },

  beforeListen: async () => {
    const lobby = await matchMaker.createRoom(RoomType.Lobby, {});
    logger.info('lobby created', lobby);
  },
});
