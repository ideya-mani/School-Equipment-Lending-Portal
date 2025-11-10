const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['sports', 'lab', 'camera', 'musical', 'project', 'other']
  },
  condition: {
    type: String,
    required: true,
    enum: ['excellent', 'good', 'fair', 'poor', 'under_maintenance'],
    default: 'good'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: function() {
      return this.quantity; // Set default to quantity
    }
  },
  location: {
    type: String,
    trim: true
  },
  specifications: {
    type: Map,
    of: String
  },
  imageUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Fixed pre-save hook
equipmentSchema.pre('save', function(next) {
  // If this is a new document, set availableQuantity to quantity
  if (this.isNew) {
    this.availableQuantity = this.quantity;
  }
  // If quantity is modified, adjust availableQuantity accordingly
  else if (this.isModified('quantity')) {
    const oldQuantity = this._originalQuantity || this.quantity;
    const quantityDiff = this.quantity - oldQuantity;
    this.availableQuantity = Math.max(0, this.availableQuantity + quantityDiff);
  }
  next();
});

// Store original quantity when loading document
equipmentSchema.pre('save', function(next) {
  if (this.isModified('quantity')) {
    this._originalQuantity = this._originalQuantity || this.quantity;
  }
  next();
});

module.exports = mongoose.model('Equipment', equipmentSchema);