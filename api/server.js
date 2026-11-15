const http = require('node:http');

const host = '127.0.0.1';
const port = 3100;
const samplePayment = {
  paymentId: 'pay_demo_001',
  amountMinor: 2499,
  currency: 'AUD',
  authorisationStatus: 'approved',
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const isSamplePayment = url.pathname === '/payments/' + samplePayment.paymentId;

  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!isSamplePayment) {
    response.writeHead(404);
    response.end(JSON.stringify({ error: 'Payment not found' }));
    return;
  }

  if (request.method !== 'GET') {
    response.writeHead(405, { Allow: 'GET' });
    response.end(JSON.stringify({ error: 'Use GET to look up this payment' }));
    return;
  }

  response.writeHead(200);
  response.end(JSON.stringify(samplePayment, null, 2));
});

server.listen(port, host, () => {
  console.log(`Demo API running at http://${host}:${port}`);
});
