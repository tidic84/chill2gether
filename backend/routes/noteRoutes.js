const express = require('express');
const noteController = require('../controllers/noteController');

const router = express.Router();

router.get('/:roomId', noteController.getNote);
router.put('/:roomId', noteController.saveNote);

module.exports = router;
