import { createServer } from 'node:http';

// Deterministic protocol fixture. It is never reported as a real System One model.
export async function decisionServer(handler) {
  const requests = [];
  const server = createServer(async (req,res) => {
    try {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      requests.push(body);
      const answer = await handler(body, requests.length);
      if (answer === null) { res.writeHead(503).end(); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(answer));
    } catch { res.writeHead(500).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { endpoint: `http://127.0.0.1:${server.address().port}/v1/systemone`, requests, close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}
export function choice(id, probabilities = { fast: 0.01, standard: 0.01, strong: 0.01 }) {
  if (Object.values(probabilities).reduce((a,b) => a+b,0) < 0.9) probabilities = { ...probabilities, [id]: 0.98 };
  return { model: 'deterministic-protocol-fixture', answers: { executor: { choice: id, probabilities } } };
}
