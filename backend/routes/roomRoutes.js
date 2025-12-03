// routes/roomRoutes.js
const express = require('express');
const {
    createRoom,
    getRoom,
    getAllRooms,
    joinRoom,
    deleteRoom
} = require('../controllers/roomController');

const router = express.Router();

router.post('/create', createRoom);

router.post('/join', joinRoom);

router.get('/', getAllRooms);

router.get('/:roomId', getRoom);

router.delete('/:roomId', deleteRoom);

module.exports = router;
