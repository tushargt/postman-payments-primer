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

## Lesson 2 · Create a payment and look it up

Restart the server if you still have Lesson 1 running. Create a blank **POST** request to `http://127.0.0.1:3100/payments`.

1. Under **Body → raw → JSON**, paste the body below. Send it once and expect **401 Unauthorized**. The demo gateway needs a credential to identify the merchant app.
2. Under **Authorization**, choose **Bearer Token** and enter `demo-merchant-token`. Send again and expect **201 Created** with `"authorisationStatus": "approved"`.
3. Copy the returned `paymentId`. In a separate **GET** request, replace `pay_demo_001` in the Lesson 1 URL with that ID. Send it and expect **200 OK** with the same payment details.
4. Change `cardToken` to `demo_decline` in the **POST** and send again. Expect **201 Created** with `"authorisationStatus": "declined"`. Try looking up this new ID too.

```json
{
  "amountMinor": 2499,
  "currency": "AUD",
  "cardToken": "demo_approve"
}
```

The bearer token is the merchant app's demo credential. The card token is a fake payment method that determines the simulated issuer decision. **201 Created** tells you a record was created for the attempt, including when the issuer declines. New payment records live in memory until you stop the server.

## Lesson 3 · Reuse the server address and pass the payment ID

### Reuse the server address

1. Save both requests in a collection named **Postman Payments Primer**. An existing personal workspace is fine.
2. In the collection's **Variables** tab, set `base_url` to `http://127.0.0.1:3100` and save.
3. Change the POST URL to `{{base_url}}/payments`. In the GET URL, replace the server address with `{{base_url}}` and keep the payment ID you copied earlier. Save and send the GET. A fresh **200 OK** confirms the variable resolved. If the placeholder is red, check the spelling, the saved variable value, and that the request belongs to the collection.

Both requests now get their server address from one place. For the first check, keep copying the ID manually so you can see what the script will replace.

### Save the ID automatically

Open the POST request's **Scripts → Post-response** tab, paste this script, and save.

```javascript
pm.collectionVariables.unset("payment_id");

if (pm.response.code === 201) {
  const { paymentId } = pm.response.json();
  if (paymentId) {
    pm.collectionVariables.set("payment_id", paymentId);
  }
}
```

The script runs after Postman receives the response. It clears the old ID first, then saves the new one from a successful creation response. A pre-request script runs before sending, when the response ID isn't available yet.

Send the POST and check the collection's **Variables** tab for `payment_id`. Then change the GET URL to `{{base_url}}/payments/{{payment_id}}`, save, and send. Expect **200 OK** and the same ID and decision returned by the POST.
