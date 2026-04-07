const fs = require('fs');
const file = '/Users/charles/Documents/abclumni/backend/src/adapters/http/routes/apiRoutes.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/, \((req: Request, res: Response)\) =>/g, ', async (req: Request, res: Response) =>');
code = code.replace(/, \((_req: Request, res: Response)\) =>/g, ', async (_req: Request, res: Response) =>');

code = code.replace(/router\.get\("\/api\/v1\/articles", \((req: Request, res: Response)\) =>/g, 'router.get("/api/v1/articles", async (req: Request, res: Response) =>');

code = code.replace(/platformService\.([a-zA-Z0-9_]+)\(/g, 'await platformService.$1(');
code = code.replace(/await await/g, 'await');

fs.writeFileSync(file, code);
