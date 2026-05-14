import { createApp } from "./adapters/http/app";

const { app, port } = createApp();

app.listen(port, () => {
    console.log(`ABC Platform API running on http://localhost:${port}`);
});
