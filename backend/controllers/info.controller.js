/**
 * YTMP3 PRO — Info Controller
 *
 * Fetches video metadata (title, thumbnail, duration) without downloading.
 */

const ytdlpService = require('../services/ytdlp.service');
const { validateUrl } = require('../utils/sanitizer');

/**
 * POST /api/info
 * Fetch video info from a YouTube URL.
 */
async function getVideoInfo(req, res, next) {
  try {
    const url = validateUrl(req.body.url);
    const info = await ytdlpService.getVideoInfo(url);

    res.json({
      status: 'ok',
      data: info,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getVideoInfo,
};
