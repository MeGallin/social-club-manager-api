const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const {
  getConsent,
  updateConsent,
} = require('../controllers/consentController');

const router = express.Router();

/**
 * @swagger
 * /api/profile/consent:
 *   get:
 *     summary: Get user's consent status
 *     tags: [Consent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Consent status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     consent:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - JWT token required
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateToken, getConsent);

/**
 * @swagger
 * /api/profile/consent:
 *   put:
 *     summary: Update user's consent status
 *     tags: [Consent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - consent
 *             properties:
 *               consent:
 *                 type: boolean
 *                 example: true
 *                 description: GDPR consent status
 *     responses:
 *       200:
 *         description: Consent status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Consent status updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     consent:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - invalid consent value
 *       401:
 *         description: Unauthorized - JWT token required
 *       500:
 *         description: Internal server error
 */
router.put('/', authenticateToken, updateConsent);

module.exports = router;
