/**
 * YTMP3 PRO — Info Routes
 */

const { Router } = require('express');
const infoController = require('../controllers/info.controller');
const { infoLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post('/', infoLimiter, infoController.getVideoInfo);

module.exports = router;
