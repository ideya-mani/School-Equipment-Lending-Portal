const Borrowing = require('../models/Borrowing');
const Equipment = require('../models/Equipment');

const checkOverdueBorrowings = async () => {
  try {
    const now = new Date();
    const overdueBorrowings = await Borrowing.find({
      status: { $in: ['approved', 'issued'] },
      dueDate: { $lt: now },
      returnDate: { $exists: false }
    });

    for (const borrowing of overdueBorrowings) {
      borrowing.status = 'overdue';
      await borrowing.save();
      
      console.log(`Marked borrowing ${borrowing._id} as overdue`);
    }

    console.log(`Checked ${overdueBorrowings.length} overdue borrowings`);
  } catch (error) {
    console.error('Error checking overdue borrowings:', error);
  }
};

const updateEquipmentAvailability = async () => {
  try {
    // Find all equipment and update available quantity based on active borrowings
    const equipmentList = await Equipment.find({ isActive: true });
    
    for (const equipment of equipmentList) {
      const activeBorrowings = await Borrowing.find({
        equipment: equipment._id,
        status: { $in: ['approved', 'issued', 'overdue'] }
      });
      
      const borrowedQuantity = activeBorrowings.reduce((sum, borrowing) => sum + borrowing.quantity, 0);
      const availableQuantity = Math.max(0, equipment.quantity - borrowedQuantity);
      
      if (equipment.availableQuantity !== availableQuantity) {
        equipment.availableQuantity = availableQuantity;
        await equipment.save();
      }
    }
  } catch (error) {
    console.error('Error updating equipment availability:', error);
  }
};

module.exports = {
  checkOverdueBorrowings,
  updateEquipmentAvailability
};