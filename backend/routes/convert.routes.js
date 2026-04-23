/**
 * YTMP3 PRO — Convert Routes
 */

const { Router } = require('express');
const convertController = require('../controllers/convert.controller');
const { convertLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post('/', convertLimiter, convertController.startConversion);
router.get('/stats', convertController.getStats);
router.get('/:jobId/status', convertController.streamStatus);
router.get('/:jobId/download', convertController.downloadFile);
router.delete('/:jobId', convertController.cancelJob);

module.exports = router;
