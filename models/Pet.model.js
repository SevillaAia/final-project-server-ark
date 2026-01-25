const mongoose = require('mongoose');

const petSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    species: { 
      type: String, 
      required: true,
      enum: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'],
      default: 'Dog'
    },
    breed: { 
      type: String, 
      required: true 
    },
    age: { 
      type: String, 
      required: true 
    },
    gender: { 
      type: String, 
      enum: ['Male', 'Female'],
      default: 'Male'
    },
    status: { 
      type: String, 
      enum: ['Available', 'Pending', 'Adopted'],
      default: 'Available'
    },
    image: { 
      type: String 
    },
    description: { 
      type: String 
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Pet', petSchema);
