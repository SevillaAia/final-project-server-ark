const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    pet: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Pet', 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
      default: 'Pending'
    },
    notes: { 
      type: String 
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Adoption', adoptionSchema);
