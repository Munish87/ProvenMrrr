require('dotenv').config({path: '.env.local'});
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
stripe.charges.list({limit: 3}).then(res => console.log(JSON.stringify(res.data.map(c => ({id: c.id, amount: c.amount, currency: c.currency, status: c.status, outcome: c.outcome, failure_message: c.failure_message, failure_code: c.failure_code})), null, 2))).catch(console.error);
