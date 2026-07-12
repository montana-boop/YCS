# Customer Service Section (Single Besties)

This document records the customer service section configured on the
Single Besties Shopify store (singlebesties.com).

## Where it lives

Online Store page: **Customer Service**
Handle: `customer-service`
URL: https://singlebesties.com/pages/customer-service

## What it covers

- **All inquiries route to jesse@straughterco.com.** Every contact point on
  the page (general questions, order questions, order changes, damaged or
  wrong items) directs customers to email jesse@straughterco.com.
- **Shipping.** The page states that orders take 7-14 business days to be
  processed and shipped, and that a tracking link is emailed once the order
  ships.
- **Returns and exchanges.** All sales are final. Damaged or incorrect items
  can be reported to jesse@straughterco.com within 7 days of delivery.
- **Left something in your cart.** A section tells shoppers who start but do
  not finish checkout that they will receive a reminder of the items they
  left behind so they can pick up where they left off.

No em dashes are used anywhere in the page copy.

## Page copy

```html
<h2>Customer Service</h2>
<p>We are here to help with anything you need. For all questions, order updates, and general inquiries, please email our customer service team at <a href="mailto:jesse@straughterco.com">jesse@straughterco.com</a>.</p>
<h3>How to reach us</h3>
<p>Email: <a href="mailto:jesse@straughterco.com">jesse@straughterco.com</a></p>
<p>We do our best to reply to every message within 1 to 2 business days.</p>
<h3>Shipping</h3>
<p>Please allow 7-14 business days for your order to be processed and shipped. You will receive a tracking link by email as soon as your order is on its way.</p>
<h3>Order questions</h3>
<p>Need to check on an order, update your shipping address, or make a change? Email us at <a href="mailto:jesse@straughterco.com">jesse@straughterco.com</a> with your order number and we will take care of it.</p>
<h3>Returns and exchanges</h3>
<p>All sales are final. We are not able to offer returns, exchanges, or refunds. If your order arrives damaged or you received the wrong item, email us at <a href="mailto:jesse@straughterco.com">jesse@straughterco.com</a> within 7 days of delivery and we will make it right.</p>
<h3>Left something in your cart?</h3>
<p>If you started checkout but did not finish, keep an eye on your inbox. We will send you a friendly reminder of the items you left behind so you can pick up right where you left off.</p>
```

## Manual step: turn on abandoned cart recovery emails

The on-page messaging promises shoppers a reminder of what they left in their
cart. The email that actually sends is a Shopify checkout automation. Shopify
does not expose that toggle for writing through the Admin API, so it has to be
switched on once in the admin:

1. Go to **Settings > Checkout** in Shopify admin.
2. Under **Abandoned checkouts**, enable **Automatically send abandoned
   checkout emails**.
3. Choose the send delay (for example, 1 to 10 hours after abandonment) and
   who receives it (all customers, or only subscribers).

Alternatively, use **Marketing > Automations** and activate the built-in
**Abandoned checkout** automation for a customizable email flow.

Once enabled, the store will automatically email shoppers a recovery link and
a summary of the items still in their cart, which matches what the Customer
Service page tells them to expect.
