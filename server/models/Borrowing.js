const mongoose = require('mongoose');

const borrowingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  borrowDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'issued', 'returned', 'overdue'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  issuedAt: {
    type: Date
  },
  conditionBefore: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  conditionAfter: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  notes: {
    type: String,
    trim: true
  },
  damageReport: {
    description: String,
    reportedAt: Date,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    repairStatus: {
      type: String,
      enum: ['reported', 'under_repair', 'repaired', 'written_off'],
      default: 'reported'
    }
  }
}, {
  timestamps: true
});

// Index for preventing overlapping bookings
borrowingSchema.index({ equipment: 1, status: 1, borrowDate: 1, dueDate: 1 });

module.exports = mongoose.model('Borrowing', borrowingSchema);