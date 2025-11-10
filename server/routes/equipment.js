const express = require('express');
const { body, validationResult } = require('express-validator');
const Equipment = require('../models/Equipment');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Equipment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [sports, lab, camera, musical, project, other]
 *         condition:
 *           type: string
 *           enum: [excellent, good, fair, poor, under_maintenance]
 *         quantity:
 *           type: integer
 *         availableQuantity:
 *           type: integer
 *         location:
 *           type: string
 *         specifications:
 *           type: object
 *         imageUrl:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/equipment:
 *   get:
 *     summary: Get all equipment with filtering
 *     tags: [Equipment]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *     responses:
 *       200:
 *         description: List of equipment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Equipment'
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, available } = req.query;
    let filter = { isActive: true };

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (available === 'true') {
      filter.availableQuantity = { $gt: 0 };
    }

    const equipment = await Equipment.find(filter).sort({ name: 1 });
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/equipment/{id}:
 *   get:
 *     summary: Get equipment by ID
 *     tags: [Equipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Equipment data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Equipment'
 */
router.get('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/equipment:
 *   post:
 *     summary: Create new equipment (admin only)
 *     tags: [Equipment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               condition:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               location:
 *                 type: string
 *               specifications:
 *                 type: object
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Equipment created
 */
router.post('/', [auth, authorize('admin')], [
  body('name').notEmpty().withMessage('Name is required'),
  body('category').isIn(['sports', 'lab', 'camera', 'musical', 'project', 'other']).withMessage('Valid category is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('condition').optional().isIn(['excellent', 'good', 'fair', 'poor', 'under_maintenance'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Ensure availableQuantity is set to quantity for new equipment
    const equipmentData = {
      ...req.body,
      availableQuantity: req.body.quantity
    };

    const equipment = new Equipment(equipmentData);
    await equipment.save();

    res.status(201).json(equipment);
  } catch (error) {
    console.error('Error creating equipment:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message) 
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/equipment/{id}:
 *   put:
 *     summary: Update equipment (admin only)
 *     tags: [Equipment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Equipment'
 *     responses:
 *       200:
 *         description: Equipment updated
 */
router.put('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    // Don't allow updating availableQuantity directly through PUT
    const { availableQuantity, ...updateData } = req.body;
    
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    res.json(equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message) 
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/equipment/{id}:
 *   delete:
 *     summary: Delete equipment (admin only)
 *     tags: [Equipment]
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
 *         description: Equipment deleted
 */
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;