const express = require('express');
const { body, validationResult } = require('express-validator');
const Borrowing = require('../models/Borrowing');
const Equipment = require('../models/Equipment');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Borrowing:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         equipment:
 *           $ref: '#/components/schemas/Equipment'
 *         quantity:
 *           type: integer
 *         borrowDate:
 *           type: string
 *           format: date-time
 *         dueDate:
 *           type: string
 *           format: date-time
 *         returnDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, issued, returned, overdue]
 */

/**
 * @swagger
 * /api/borrowings:
 *   post:
 *     summary: Create borrowing request
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - equipmentId
 *               - quantity
 *               - dueDate
 *             properties:
 *               equipmentId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Borrowing request created
 */
router.post('/', auth, [
  body('equipmentId').notEmpty().withMessage('Equipment ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { equipmentId, quantity, dueDate } = req.body;

    // Check equipment availability
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || !equipment.isActive) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (equipment.availableQuantity < quantity) {
      return res.status(400).json({ message: 'Not enough equipment available' });
    }

    // Check for overlapping bookings
    const overlapping = await Borrowing.findOne({
      equipment: equipmentId,
      status: { $in: ['approved', 'issued', 'pending'] },
      $or: [
        { borrowDate: { $lte: new Date(dueDate) }, dueDate: { $gte: new Date() } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ message: 'Equipment already booked for this period' });
    }

    const borrowing = new Borrowing({
      user: req.user._id,
      equipment: equipmentId,
      quantity,
      dueDate: new Date(dueDate),
      conditionBefore: equipment.condition
    });

    await borrowing.save();
    await borrowing.populate('equipment');

    res.status(201).json(borrowing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/borrowings:
 *   get:
 *     summary: Get borrowings with filters
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID (admin only)
 *     responses:
 *       200:
 *         description: List of borrowings
 */
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    // Students can only see their own borrowings
    if (req.user.role === 'student') {
      filter.user = req.user._id;
    }
    // Staff and admin can see all borrowings by default
    // but can filter by user if needed

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
      filter.user = req.query.user;
    }

    const borrowings = await Borrowing.find(filter)
      .populate('user', 'name email role studentId')
      .populate('equipment')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(borrowings);
  } catch (error) {
    console.error('Error fetching borrowings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/borrowings/{id}/approve:
 *   patch:
 *     summary: Approve borrowing request (staff/admin only)
 *     tags: [Borrowings]
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
 *         description: Request approved
 */
router.patch('/:id/approve', [auth, authorize('staff', 'admin')], async (req, res) => {
  try {
    const borrowing = await Borrowing.findById(req.params.id).populate('equipment');
    
    if (!borrowing) {
      return res.status(404).json({ message: 'Borrowing request not found' });
    }

    if (borrowing.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update equipment available quantity
    const equipment = await Equipment.findById(borrowing.equipment._id);
    if (equipment.availableQuantity < borrowing.quantity) {
      return res.status(400).json({ message: 'Not enough equipment available' });
    }

    equipment.availableQuantity -= borrowing.quantity;
    await equipment.save();

    borrowing.status = 'approved';
    borrowing.approvedBy = req.user._id;
    borrowing.approvedAt = new Date();
    await borrowing.save();

    await borrowing.populate('approvedBy', 'name');

    res.json(borrowing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/borrowings/{id}/reject:
 *   patch:
 *     summary: Reject borrowing request (staff/admin only)
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request rejected
 */
router.patch('/:id/reject', [auth, authorize('staff', 'admin')], async (req, res) => {
  try {
    const borrowing = await Borrowing.findById(req.params.id);
    
    if (!borrowing) {
      return res.status(404).json({ message: 'Borrowing request not found' });
    }

    if (borrowing.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    borrowing.status = 'rejected';
    borrowing.approvedBy = req.user._id;
    borrowing.approvedAt = new Date();
    borrowing.notes = req.body.notes || 'Request rejected';
    await borrowing.save();

    await borrowing.populate('approvedBy', 'name');

    res.json(borrowing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/borrowings/{id}/issue:
 *   patch:
 *     summary: Issue equipment (staff/admin only)
 *     tags: [Borrowings]
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
 *         description: Equipment issued
 */
router.patch('/:id/issue', [auth, authorize('staff', 'admin')], async (req, res) => {
  try {
    const borrowing = await Borrowing.findById(req.params.id);
    
    if (!borrowing) {
      return res.status(404).json({ message: 'Borrowing request not found' });
    }

    if (borrowing.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved requests can be issued' });
    }

    borrowing.status = 'issued';
    borrowing.issuedAt = new Date();
    await borrowing.save();

    res.json(borrowing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/borrowings/{id}/return:
 *   patch:
 *     summary: Return equipment
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conditionAfter:
 *                 type: string
 *                 enum: [excellent, good, fair, poor]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Equipment returned
 */
router.patch('/:id/return', auth, async (req, res) => {
  try {
    const borrowing = await Borrowing.findById(req.params.id).populate('equipment');
    
    if (!borrowing) {
      return res.status(404).json({ message: 'Borrowing record not found' });
    }

    if (!['issued', 'overdue'].includes(borrowing.status)) {
      return res.status(400).json({ message: 'Only issued equipment can be returned' });
    }

    // Update equipment available quantity
    const equipment = await Equipment.findById(borrowing.equipment._id);
    equipment.availableQuantity += borrowing.quantity;
    await equipment.save();

    borrowing.status = 'returned';
    borrowing.returnDate = new Date();
    borrowing.conditionAfter = req.body.conditionAfter || borrowing.conditionBefore;
    borrowing.notes = req.body.notes || borrowing.notes;

    // Check for damage
    if (req.body.conditionAfter && req.body.conditionAfter !== borrowing.conditionBefore) {
      borrowing.damageReport = {
        description: `Equipment condition changed from ${borrowing.conditionBefore} to ${req.body.conditionAfter}`,
        reportedAt: new Date(),
        reportedBy: req.user._id,
        repairStatus: 'reported'
      };
    }

    await borrowing.save();

    res.json(borrowing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @swagger
 * /api/borrowings/{id}/approve:
 *   patch:
 *     summary: Approve borrowing request (staff/admin only)
 *     tags: [Borrowings]
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
 *         description: Request approved
 */
router.patch('/:id/approve', [auth, authorize('staff', 'admin')], async (req, res) => {
  try {
    const borrowing = await Borrowing.findById(req.params.id).populate('equipment');
    
    if (!borrowing) {
      return res.status(404).json({ message: 'Borrowing request not found' });
    }

    if (borrowing.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update equipment available quantity
    const equipment = await Equipment.findById(borrowing.equipment._id);
    if (equipment.availableQuantity < borrowing.quantity) {
      return res.status(400).json({ message: 'Not enough equipment available' });
    }

    // Update equipment available quantity
    equipment.availableQuantity -= borrowing.quantity;
    await equipment.save();

    borrowing.status = 'approved';
    borrowing.approvedBy = req.user._id;
    borrowing.approvedAt = new Date();
    await borrowing.save();

    await borrowing.populate('approvedBy', 'name');

    res.json(borrowing);
  } catch (error) {
    console.error('Error approving borrowing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/borrowings/{id}/return:
 *   patch:
 *     summary: Return equipment
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conditionAfter:
 *                 type: string
 *                 enum: [excellent, good, fair, poor]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Equipment returned
 */
router.patch('/:id/return', auth, async (req, res) => {
  try {
    const borrowing = await Borrowing.findById(req.params.id).populate('equipment');
    
    if (!borrowing) {
      return res.status(404).json({ message: 'Borrowing record not found' });
    }

    if (!['issued', 'overdue'].includes(borrowing.status)) {
      return res.status(400).json({ message: 'Only issued equipment can be returned' });
    }

    // Update equipment available quantity
    const equipment = await Equipment.findById(borrowing.equipment._id);
    equipment.availableQuantity += borrowing.quantity;
    await equipment.save();

    borrowing.status = 'returned';
    borrowing.returnDate = new Date();
    borrowing.conditionAfter = req.body.conditionAfter || borrowing.conditionBefore;
    borrowing.notes = req.body.notes || borrowing.notes;

    // Check for damage
    if (req.body.conditionAfter && req.body.conditionAfter !== borrowing.conditionBefore) {
      borrowing.damageReport = {
        description: `Equipment condition changed from ${borrowing.conditionBefore} to ${req.body.conditionAfter}`,
        reportedAt: new Date(),
        reportedBy: req.user._id,
        repairStatus: 'reported'
      };
    }

    await borrowing.save();

    res.json(borrowing);
  } catch (error) {
    console.error('Error returning equipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;






