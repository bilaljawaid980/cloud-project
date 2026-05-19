import { app } from "./app";
import { config } from "./config/env";

const server = Bun.serve({
  port: config.port,
  fetch: app.fetch
});

console.log(
  JSON.stringify({
    level: "info",
    event: "clipforge_api_started",
    port: server.port,
    env: config.nodeEnv
  })
);

export default server;
