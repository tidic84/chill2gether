// routes/searchRoutes.js
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();


// /api/search?q=lofi
router.get("/search", getSearchResults);

module.exports = router;
