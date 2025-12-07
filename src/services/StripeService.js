// Replace this with your actual Stripe Payment Link from Step 3 of PAYMENT_SETUP.md
export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_placeholder";

export const redirectToCheckout = () => {
    if (STRIPE_PAYMENT_LINK.includes("test_placeholder")) {
        alert("Please set up your Stripe Link in src/services/StripeService.js first! See PAYMENT_SETUP.md");
        return;
    }
    window.location.href = STRIPE_PAYMENT_LINK;
};
