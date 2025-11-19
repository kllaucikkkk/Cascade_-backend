// routes/exchange.js
const express = require('express');
const router = express.Router();
const axios = require('axios'); // npm install axios

// Endpoint do pobierania kursów walut z NBP
router.get('/api/exchange-rates', async (req, res) => {
  console.log('GET /api/exchange-rates');
  try {
    // Pobierz kursy walut z tabeli A (najpopularniejsze waluty)
    const response = await axios.get('https://api.nbp.pl/api/exchangerates/tables/A?format=json');
    
    const rates = response.data[0].rates;
    const effectiveDate = response.data[0].effectiveDate;
    
    // Możesz filtrować tylko te waluty, które Cię interesują
    const currencies = ['USD', 'EUR', 'GBP', 'CHF', 'CZK'];
    const filteredRates = rates.filter(rate => currencies.includes(rate.code));
    
    res.json({
      success: true,
      date: effectiveDate,
      rates: filteredRates
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({
      success: false,
      message: 'Nie udało się pobrać kursów walut'
    });
  }
});

// Endpoint do pobierania kursu konkretnej waluty
router.get('/api/exchange-rates/:currency', async (req, res) => {
  try {
    const { currency } = req.params;
    const response = await axios.get(`https://api.nbp.pl/api/exchangerates/rates/A/${currency}?format=json`);
    
    const rate = response.data.rates[0];
    
    res.json({
      success: true,
      currency: response.data.code,
      currencyName: response.data.currency,
      rate: rate.mid,
      date: rate.effectiveDate
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    res.status(500).json({
      success: false,
      message: 'Nie udało się pobrać kursu waluty'
    });
  }
});

module.exports = router;
