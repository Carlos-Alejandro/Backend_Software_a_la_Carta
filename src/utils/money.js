// src/utils/money.js
function toCents(n) {
  return Math.round(Number(n) * 100);
}

function toPesos(cents) {
  return Number((Number(cents) / 100).toFixed(2));
}

function formatMXN(cents) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
    .format(Number(cents) / 100);
}

module.exports = { toCents, toPesos, formatMXN };
