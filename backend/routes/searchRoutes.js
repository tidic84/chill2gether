// routes/searchRoutes.js
const express = require('express');
const { getSearchResults } = require('../controllers/searchController');

const router = express.Router();


// /api/search?q=lofi
router.get("/search", getSearchResults);

module.exports = router;
