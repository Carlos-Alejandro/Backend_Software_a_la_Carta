// src/config/stripe.js
const Stripe = require('stripe');

let instance = null;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Falta STRIPE_SECRET_KEY en el .env');
  }
  if (!instance) {
    instance = new Stripe(key, { apiVersion: '2024-06-20' });
  }
  return instance;
}

module.exports = getStripe;
