# Setting Up Payments with Stripe 💳

To receive money from users, you need a Stripe account. We will use **Stripe Payment Links** which handle Credit Cards, Klarna, and PayPal automatically.

## Step 1: Create a Stripe Account
1.  Go to [Stripe.com](https://stripe.com) and Sign Up.
2.  Activate your account by entering your business/bank details (so you get paid!).

## Step 2: Create Your "Pro Producer" Product
1.  In Stripe Dashboard, go to **Products** -> **Add Product**.
2.  **Name**: "Pro Producer Subscription".
3.  **Price**: $9.99 (or your currency).
4.  **Billing**: Recurring (Monthly).

## Step 3: Create a Payment Link
1.  After creating the product, click **Create Payment Link**.
2.  **Options**:
    *   Enable "Collect tax automatically" (recommended).
    *   "Allow promotion codes" (optional).
3.  **After Payment**:
    *   In the "Confirmation page" section, select "Don't show confirmation page".
    *   **Redirect to your website**: Enter your app's URL + `?success=true`.
    *   *Example for local development*: `http://localhost:5173/?success=true`
    *   *Example for live site*: `https://your-site.com/?success=true`
4.  Click **Create Link**.
5.  **Copy the URL**. It will look like `https://buy.stripe.com/test_...`

## Step 4: Add Link to App
1.  Open `src/services/StripeService.js`.
2.  Paste your link into the `STRIPE_PAYMENT_LINK` constant.

---

> [!TIP]
> **Klarna & PayPal**: Go to **Settings -> Payment Methods** in Stripe and enable Klarna and PayPal. They will automatically appear on your payment link!

## FAQ / Troubleshooting
**Q: "Business Website" Field?**
Since your app is local, you can use a **Social Media profile** (Instagram, LinkedIn, SoundCloud) as your website for now.
*Alternatively, ask me to "Deploy the app" and I can put it online to get you a real URL.*
