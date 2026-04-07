import { createApp } from "./adapters/http/app";

const { app, port } = createApp();

app.listen(port, () => {
    console.log(`ABC Alumni API running on http://localhost:${port}`);
});
