import { app } from "./app";
import { config } from "./config/env";

app.listen(config.port, () => {
  console.log(`FRA backend listening on http://localhost:${config.port}`);
});