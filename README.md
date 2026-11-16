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

Open the POST request's **Scripts → After response** tab, paste this script, and save.

```javascript
pm.collectionVariables.unset("payment_id");

if (pm.response.code === 201) {
  const { paymentId } = pm.response.json();
  if (paymentId) {
    pm.collectionVariables.set("payment_id", paymentId);
  }
}
```

The script runs after Postman receives the response. It clears the old ID first, then saves the new one from a successful creation response. A Before request script runs before sending, when the response ID isn't available yet.

Send the POST and check the collection's **Variables** tab for `payment_id`. Then change the GET URL to `{{base_url}}/payments/{{payment_id}}`, save, and send. Expect **200 OK** and the same ID and decision returned by the POST.

### Check that GET returns the right payment

In the GET request, open **Scripts → After response** and add this test.

```javascript
pm.test("GET returns the payment created by POST", function () {
  pm.response.to.have.status(200);

  const expectedId = pm.collectionVariables.get("payment_id");
  pm.expect(pm.response.json().paymentId).to.equal(expectedId);
});
```

Send the POST and then the GET. Open **Test Results** and expect **1/1**.

Try a wrong-payment lookup. Leave the script and the captured `payment_id` as they are, but temporarily change the GET URL to `{{base_url}}/payments/pay_demo_001`. The API still returns **200 OK** because the sample payment exists. The test fails because its ID differs from the one the POST created. Restore `{{base_url}}/payments/{{payment_id}}`, save, and send again to see the test pass.

[Wrong payment: 200 OK, 0/1 passed](guide/screenshots/wrong-payment.png) · [Expected payment: 200 OK, 1/1 passed](guide/screenshots/get-assertion.png)

## Lesson 4 · Run the collection

1. With the demo API running, open the collection menu and choose **Run**.
2. Select **Functional**, **Local**, and **1** iteration. In **Run order**, put **POST create payment** above **GET payments** so the POST saves the ID before the GET uses it.
3. Click **Start run**. Expect POST **201 Created**, GET **200 OK**, and **1 passed**, **0 failed**.

The POST script stores the ID. The GET contains the assertion, so the runner lists one test overall.

[Open Runner](guide/screenshots/runner-menu.png) · [Initial order](guide/screenshots/runner-initial-order.png) · [Correct order](guide/screenshots/runner-correct-order.png) · [Run results](guide/screenshots/runner-results.png)

## Lesson 5 · Review an AI-generated test

Use Postman's **Ask AI** to draft two checks for the POST request's **Scripts → After response** tab. Ask it to preserve the existing script that saves `payment_id`, check for **201 Created**, and compare the returned decision with the expected decision for the request's demo card token.

Review the proposed change before approving. The example correctly maps `demo_approve` to `approved` and `demo_decline` to `declined`. Its fallback only checks whether the decision is a string for an unknown token. Ask for a revision that fails explicitly when the request token has no expected decision. A separate negative test could check that the API returns **400 Bad Request** for an unknown token.

[Proposed change](guide/screenshots/ai-proposed-change.png) · [Fallback to revise](guide/screenshots/ai-fallback-review.png)

After applying the revised tests, send the POST once with each card token.

| Card token | HTTP status | Payment decision | Test results |
| --- | --- | --- | --- |
| `demo_approve` | `201 Created` | `approved` | 2/2 passed |
| `demo_decline` | `201 Created` | `declined` | 2/2 passed |

An expected decline passes because the returned decision matches the scenario.

[Approval run](guide/screenshots/ai-test-approved.png) · [Decline run](guide/screenshots/ai-test-declined.png)

Run the collection again with POST first and GET second. Expect **3 passed, 0 failed**. The POST checks the status and payment decision, and the GET checks that the lookup returns the payment created in the same run.

[Runner results with all three checks](guide/screenshots/ai-runner-results.png)

## Lesson 6 · Choose an environment

An environment holds settings for a target such as local development or staging. Both requests can keep using `{{base_url}}` when you switch targets. The collection's `payment_id` tracks the payment created by the POST during the workflow.

1. In **Environments**, create **Local Demo**. Add `base_url` with the value `http://127.0.0.1:3100`, save, and select **Local Demo** in the environment dropdown at the top right.
2. Remove `base_url` from the collection's **Variables** tab so the requests depend on the selected environment. Keep `payment_id` in the collection and leave both request URLs as they are.
3. With the API running, run the collection locally with **Local Demo** selected and **POST before GET**. Expect **201 Created**, **200 OK**, and **3 passed**.

If `{{base_url}}` is unresolved, check that **Local Demo** is selected for the run and the variable is spelled correctly.

[Local Demo variable setup](guide/screenshots/local-demo-variables.png) · [Runner using Local Demo with three passing tests](guide/screenshots/local-demo-run.png)

### API credentials and payment decisions

- **API authentication** checks the caller's credential. This demo POST expects `Authorization: Bearer demo-merchant-token`. **API authorisation** determines what the authenticated caller can do.
- **Payment authorisation** is the issuer's approval or decline. In this demo, `cardToken` selects the simulated decision.
- APIs can also use **API keys**, **Basic auth** (a username and password), or **OAuth 2.0**, which can issue scoped access tokens. Use the scheme the API documents.

The demo token is safe to share. For real credentials, use a secret store such as Postman Vault. Keep real tokens and card data out of exports, screenshots, Git, and AI prompts. An environment variable is a way to supply a value. Store sensitive values separately.

## Import the finished workflow

Use **Import** in Postman to import both the [collection](postman/payments.postman_collection.json) and the [Local Demo environment](postman/local-demo.postman_environment.json). Use a separate workspace to try the import alongside your hand-built requests.

Start the API, select **Local Demo**, and run the imported collection locally with **POST before GET**. Expect **3 passed, 0 failed**. The imported `payment_id` starts empty. The POST fills it in during the run. The POST defaults to `demo_approve`. Change the body to `demo_decline` to try the other outcome.

[Example run after importing both files from GitHub](guide/screenshots/fresh-import-run.png)
