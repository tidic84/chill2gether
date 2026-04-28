const express = require('express');
const noteController = require('../controllers/noteController');

const router = express.Router();

router.get('/hashtags', noteController.getAllHashtags);
router.get('/:hashtag', noteController.getNote);
router.put('/', noteController.saveNote);

module.exports = router;
