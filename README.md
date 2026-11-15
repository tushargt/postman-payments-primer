# Did this payment get approved?

## The payment story

Shopper pays → Merchant sends a request through the gateway → Issuer decides → Merchant receives the decision

The issuer is the institution that issued the card. This demo represents the gateway's side of the lookup with a fictional payment that has already been authorised.

## Lesson 1 · Look up one payment

### Check your setup

1. Open **Terminal** on macOS or **PowerShell** on Windows and run `node --version`. A version number means the shell can run Node.js.
2. If the command is missing, install the **LTS** version from the [Node.js download page](https://nodejs.org/en/download). Choose the macOS installer (`.pkg`) or Windows installer (`.msi`) for your computer. Close and reopen your terminal, then run `node --version` again.
3. Install the [Postman desktop app](https://www.postman.com/downloads/) for your operating system.

### Start the API and send a request

Open Terminal or PowerShell in the project folder containing `README.md`, then run:

```sh
node api/server.js
```

Wait for `Demo API running at http://127.0.0.1:3100` and leave the terminal open. Press Ctrl+C when you're done.

1. Open a blank request in the Postman desktop app.
2. Choose **GET** and paste `http://127.0.0.1:3100/payments/pay_demo_001`.
3. Click **Send**. Then replace `pay_demo_001` with `pay_missing` and send it again.

| Payment ID | HTTP status | What to look for in the response body |
| --- | --- | --- |
| `pay_demo_001` | `200 OK` | `"authorisationStatus": "approved"` |
| `pay_missing` | `404 Not Found` | `"error": "Payment not found"` |

**200 OK** means the lookup succeeded. **approved** is the payment decision. The amount is 2,499 cents, or A$24.99.

If Postman can't connect, check that the terminal is still running the server and that the request URL uses port `3100`.

## Where the code lives

`api/server.js` holds the sample payment and handles the lookup. Node.js provides the HTTP server, so there's no package install step.
