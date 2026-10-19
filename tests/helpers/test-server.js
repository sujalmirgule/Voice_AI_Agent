import app from '../../server/src/server.js';

export async function createTestServer() {
  let server;
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });

  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const closeServer = () => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  };

  return { server, baseUrl, closeServer };
}
