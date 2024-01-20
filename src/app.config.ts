import config from '@colyseus/tools';
import { monitor } from '@colyseus/monitor';
import { playground } from '@colyseus/playground';
import basicAuth from 'express-basic-auth';
import express from 'express';
import path from 'path';

import { DummyRoom, GameRoom } from './rooms';

export default config({
  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    gameServer.define('gameRoom', GameRoom).enableRealtimeListing();
    if (process.env.NODE_ENV !== 'production') {
      gameServer.define('dummyRoom', DummyRoom).enableRealtimeListing();
    }
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

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});
