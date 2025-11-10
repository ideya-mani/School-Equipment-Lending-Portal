const express = require('express');
const User = require('../models/User');
const Borrowing = require('../models/Borrowing');
const Equipment = require('../models/Equipment');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', [auth, authorize('admin')], async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get('/stats', [auth, authorize('admin')], async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: 'student' });
    const staff = await User.countDocuments({ role: 'staff' });
    const admins = await User.countDocuments({ role: 'admin' });

    // Get borrowing statistics
    const totalBorrowings = await Borrowing.countDocuments();
    const pendingBorrowings = await Borrowing.countDocuments({ status: 'pending' });
    const activeBorrowings = await Borrowing.countDocuments({ status: { $in: ['approved', 'issued'] } });
    const overdueBorrowings = await Borrowing.countDocuments({ status: 'overdue' });

    // Equipment statistics
    const totalEquipment = await Equipment.countDocuments({ isActive: true });
    const availableEquipment = await Equipment.countDocuments({ 
      isActive: true, 
      availableQuantity: { $gt: 0 } 
    });

    res.json({
      users: {
        total: totalUsers,
        students,
        staff,
        admins
      },
      borrowings: {
        total: totalBorrowings,
        pending: pendingBorrowings,
        active: activeBorrowings,
        overdue: overdueBorrowings
      },
      equipment: {
        total: totalEquipment,
        available: availableEquipment
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}/borrowings:
 *   get:
 *     summary: Get user's borrowing history (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's borrowing history
 */
router.get('/:id/borrowings', [auth, authorize('admin')], async (req, res) => {
  try {
    const borrowings = await Borrowing.find({ user: req.params.id })
      .populate('equipment')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(borrowings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;