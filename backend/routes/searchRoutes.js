// routes/searchRoutes.js
const express = require('express');
const { getSearchResults, getSuggestions } = require('../controllers/searchController');

const router = express.Router();


// /api/search/search?q=lofi
router.get("/search", getSearchResults);

// /api/search/suggestions?q=lo
router.get("/suggestions", getSuggestions);

module.exports = router;
