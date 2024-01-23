import path from 'path';

import type { NextFunction, Request, Response } from 'express';

export function historyApiFallback(root: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (
      (req.method === 'GET' || req.method === 'HEAD') &&
      req.accepts('html')
    ) {
      res.sendFile(path.join(root, './index.html'), (err) => err && next());
    } else next();
  };
}
