const http = require('node:http');
const { randomUUID } = require('node:crypto');

const host = '127.0.0.1';
const port = 3100;
const samplePayment = {
  paymentId: 'pay_demo_001',
  amountMinor: 2499,
  currency: 'AUD',
  authorisationStatus: 'approved',
};
const payments = new Map([[samplePayment.paymentId, samplePayment]]);
const demoCards = new Map([
  ['demo_approve', 'approved'],
  ['demo_decline', 'declined'],
]);

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
  response.end(JSON.stringify(body, null, 2));
}

async function createPayment(request, response) {
  if (request.headers.authorization !== 'Bearer demo-merchant-token') {
    sendJson(response, 401, { error: 'A valid demo bearer token is required' }, {
      'WWW-Authenticate': 'Bearer',
    });
    return;
  }

  let input;
  try {
    let body = '';
    for await (const chunk of request.setEncoding('utf8')) {
      body += chunk;
      if (body.length > 8192) {
        sendJson(response, 413, { error: 'Request body is too large' });
        return;
      }
    }
    input = JSON.parse(body);
  } catch {
    sendJson(response, 400, { error: 'Send a valid JSON body' });
    return;
  }

  const { amountMinor, currency, cardToken } = input ?? {};
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 ||
      currency !== 'AUD' || !demoCards.has(cardToken)) {
    sendJson(response, 400, {
      error: 'Provide a positive integer amountMinor, currency AUD, and a valid demo cardToken',
    });
    return;
  }

  const paymentId = 'pay_' + randomUUID();
  const payment = {
    paymentId,
    amountMinor,
    currency,
    authorisationStatus: demoCards.get(cardToken),
  };
  payments.set(paymentId, payment);
  sendJson(response, 201, payment, { Location: '/payments/' + paymentId });
}

const server = http.createServer((request, response) => {
  const { pathname, searchParams } = new URL(request.url, 'http://localhost');
  if (pathname === '/payments') {
    if (request.method === 'POST') {
      return createPayment(request, response);
    }
    if (request.method === 'GET') {
      const status = searchParams.get('status');
      if (status !== null && status !== 'approved' && status !== 'declined') {
        return sendJson(response, 400, { error: 'status must be approved or declined' });
      }
      const results = [...payments.values()].filter(
        payment => status === null || payment.authorisationStatus === status
      );
      return sendJson(response, 200, results);
    }
    return sendJson(response, 405, { error: 'Use GET or POST for payments' }, { Allow: 'GET, POST' });
  }

  const match = pathname.match(/^\/payments\/([^/]+)$/);
  const payment = match && payments.get(match[1]);
  if (!payment) {
    return sendJson(response, 404, { error: 'Payment not found' });
  }
  if (request.method !== 'GET') {
    return sendJson(response, 405, { error: 'Use GET to look up this payment' }, { Allow: 'GET' });
  }

  sendJson(response, 200, payment);
});

server.listen(port, host, () => {
  console.log(`Demo API running at http://${host}:${port}`);
});
