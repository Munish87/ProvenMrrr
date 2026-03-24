import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const key = process.env.STRIPE_SECRET_KEY;
console.log('Using key starting with:', key ? key.substring(0, 7) : 'NONE');

if (!key) {
    console.error('STRIPE_SECRET_KEY is missing');
    process.exit(1);
}

const stripe = new Stripe(key, {
    apiVersion: '2025-01-27.acacia',
});

async function test() {
    try {
        const account = await stripe.accounts.retrieve();
        console.log('Account Info:', account.id, account.settings?.dashboard?.display_name);
        console.log('Key is VALID');
    } catch (err) {
        console.error('Key is INVALID or UNAUTHORIZED');
        console.error('Error Message:', err.message);
        console.error('Error Code:', err.code);
        console.error('Error Type:', err.type);
    }
}

test();
