const mongoose = require('mongoose');

const wildAnimalSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    species: { 
      type: String, 
      required: true 
    },
    rescueDate: { 
      type: Date, 
      required: true,
      default: Date.now
    },
    location: { 
      type: String, 
      required: true 
    },
    condition: { 
      type: String, 
      enum: ['Critical', 'Stable', 'Good'],
      default: 'Stable'
    },
    injuryType: { 
      type: String, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['Under Treatment', 'Recovering', 'Ready for Release', 'Released'],
      default: 'Under Treatment'
    },
    image: { 
      type: String 
    },
    notes: { 
      type: String 
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WildAnimal', wildAnimalSchema);
