const router = require("express").Router();
const UserModel = require("../models/User.model");
const Comment = require("../models/Comment.model");
const Pet = require("../models/Pet.model");
const WildAnimal = require("../models/WildAnimal.model");
const Adoption = require("../models/Adoption.model");

const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAuthenticated, isAdmin } = require("../middlewares/jwt.middlewares");
//route to /signup a new user
router.post("/signup", async (req, res) => {
  //destructur the req.body
  const { email, password } = req.body;
  try {
    const userAlreadyInDB = await UserModel.findOne({ email });
    if (userAlreadyInDB) {
      res.status(400).json({ errorMessage: "Email already registered. Please use a different email or login." });
    } else {
      const theSalt = bcryptjs.genSaltSync(12);
      const theHashedPassword = bcryptjs.hashSync(password, theSalt);
      const hashedUser = {
        ...req.body,
        password: theHashedPassword,
      };
      const createdUser = await UserModel.create(hashedUser);
      res.status(201).json(createdUser);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMesage: error });
  }
});

//route to /login an existing user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userAlreadyInDB = await UserModel.findOne({ email });
    if (!userAlreadyInDB) {
      res.status(403).json({ errorMessage: "Invalid Credentials" });
    } else {
      const doesPasswordsMatch = bcryptjs.compareSync(
        password,
        userAlreadyInDB.password,
      );
      if (!doesPasswordsMatch) {
        res.status(403).json({ errorMessage: "Invalid Credentials" });
      } else {
        const payload = { _id: userAlreadyInDB._id, role: userAlreadyInDB.role };
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });

        res
          .status(200)
          .json({ 
            message: "you are now logged in, nice work", 
            authToken,
            user: {
              _id: userAlreadyInDB._id,
              username: userAlreadyInDB.username,
              email: userAlreadyInDB.email,
              role: userAlreadyInDB.role,
              status: userAlreadyInDB.status
            }
          });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMesage: error });
  }
});

//this route verifies the auth token
router.get("/verify", isAuthenticated, async (req, res) => {
  const currentLoggedInUser = await UserModel.findById(req.payload._id).select(
    "-password -email",
  );
  res.status(200).json({ message: "Token is valid :) ", currentLoggedInUser });
});

// Update own profile (logged-in user)
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const userId = req.payload._id;
    const { username, email, profilePicture } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { username, email, profilePicture },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ errorMessage: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error updating profile" });
  }
});

// Get all comments
router.get("/comments", async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate("user", "username profilePicture email")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
});

router.get("/user", async (req, res) => {
    const allUsers = await UserModel.find().select("");
    res.status(200).json(allUsers);
}
  )

// Update user role (Admin only)
router.put("/user/:userId/role", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ["User", "Volunteer", "Admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ errorMessage: "Invalid role. Must be User, Volunteer, or Admin." });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ errorMessage: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error updating user role" });
  }
});

// Update user status (Admin only)
router.put("/user/:userId/status", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["Active", "Inactive"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ errorMessage: "Invalid status. Must be Active or Inactive." });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ errorMessage: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error updating user status" });
  }
});

// Update user (Admin only) - for editing name, email, role, status
router.put("/user/:userId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, role, status } = req.body;

    // Validate role if provided
    if (role) {
      const validRoles = ["User", "Volunteer", "Admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ errorMessage: "Invalid role." });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ["Active", "Inactive"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ errorMessage: "Invalid status." });
      }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { username, email, role, status },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ errorMessage: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error updating user" });
  }
});

// Delete user (Admin only)
router.delete("/user/:userId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ errorMessage: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error deleting user" });
  }
});

// ==================== PET ROUTES ====================

// GET all pets
router.get("/pets", async (req, res) => {
  try {
    const pets = await Pet.find().sort({ createdAt: -1 });
    res.status(200).json(pets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error fetching pets" });
  }
});

// GET single pet by ID
router.get("/pets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({ errorMessage: "Pet not found" });
    }

    res.status(200).json(pet);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error fetching pet" });
  }
});

// POST create a new pet (Admin/Volunteer only)
router.post("/pets", isAuthenticated, async (req, res) => {
  try {
    const { name, species, breed, age, gender, status, image, description } = req.body;

    const newPet = await Pet.create({
      name,
      species,
      breed,
      age,
      gender,
      status,
      image,
      description,
    });

    res.status(201).json(newPet);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error creating pet" });
  }
});

// PUT update a pet by ID (Admin/Volunteer only)
router.put("/pets/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, species, breed, age, gender, status, image, description } = req.body;

    const updatedPet = await Pet.findByIdAndUpdate(
      id,
      { name, species, breed, age, gender, status, image, description },
      { new: true, runValidators: true }
    );

    if (!updatedPet) {
      return res.status(404).json({ errorMessage: "Pet not found" });
    }

    res.status(200).json(updatedPet);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error updating pet" });
  }
});

// DELETE a pet by ID (Admin only)
router.delete("/pets/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPet = await Pet.findByIdAndDelete(id);

    if (!deletedPet) {
      return res.status(404).json({ errorMessage: "Pet not found" });
    }

    res.status(200).json({ message: "Pet deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error deleting pet" });
  }
});

// ==================== WILD ANIMAL RESCUE ROUTES ====================

// GET all wild animals
router.get("/wild-animals", async (req, res) => {
  try {
    const wildAnimals = await WildAnimal.find().sort({ createdAt: -1 });
    res.status(200).json(wildAnimals);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error fetching wild animals" });
  }
});

// GET single wild animal by ID
router.get("/wild-animals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const wildAnimal = await WildAnimal.findById(id);

    if (!wildAnimal) {
      return res.status(404).json({ errorMessage: "Wild animal not found" });
    }

    res.status(200).json(wildAnimal);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error fetching wild animal" });
  }
});

// POST create a new wild animal rescue case
router.post("/wild-animals", isAuthenticated, async (req, res) => {
  try {
    const { name, species, rescueDate, location, condition, injuryType, status, image, notes } = req.body;

    const newWildAnimal = await WildAnimal.create({
      name,
      species,
      rescueDate,
      location,
      condition,
      injuryType,
      status,
      image,
      notes,
    });

    res.status(201).json(newWildAnimal);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error creating wild animal rescue case" });
  }
});

// PUT update a wild animal by ID
router.put("/wild-animals/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, species, rescueDate, location, condition, injuryType, status, image, notes } = req.body;

    const updatedWildAnimal = await WildAnimal.findByIdAndUpdate(
      id,
      { name, species, rescueDate, location, condition, injuryType, status, image, notes },
      { new: true, runValidators: true }
    );

    if (!updatedWildAnimal) {
      return res.status(404).json({ errorMessage: "Wild animal not found" });
    }

    res.status(200).json(updatedWildAnimal);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error updating wild animal" });
  }
});

// DELETE a wild animal by ID (Admin only)
router.delete("/wild-animals/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedWildAnimal = await WildAnimal.findByIdAndDelete(id);

    if (!deletedWildAnimal) {
      return res.status(404).json({ errorMessage: "Wild animal not found" });
    }

    res.status(200).json({ message: "Wild animal rescue case deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error deleting wild animal" });
  }
});

// ==================== ADOPTION ROUTES ====================

// POST create a new adoption
router.post("/adoptions", isAuthenticated, async (req, res) => {
  try {
    const { pet, notes } = req.body;
    const userId = req.payload._id;

    // Check if pet exists and is available
    const petExists = await Pet.findById(pet);
    if (!petExists) {
      return res.status(404).json({ errorMessage: "Pet not found" });
    }

    if (petExists.status !== 'Available') {
      return res.status(400).json({ errorMessage: "Pet is not available for adoption" });
    }

    // Check if user already has a pending adoption for this pet
    const existingAdoption = await Adoption.findOne({ 
      user: userId, 
      pet: pet, 
      status: { $in: ['Pending', 'Approved'] } 
    });

    if (existingAdoption) {
      return res.status(400).json({ errorMessage: "You already have an active adoption request for this pet" });
    }

    const newAdoption = await Adoption.create({
      user: userId,
      pet,
      notes,
    });

    // Update pet status to Pending
    await Pet.findByIdAndUpdate(pet, { status: 'Pending' });

    const populatedAdoption = await Adoption.findById(newAdoption._id)
      .populate("user", "username email profilePicture")
      .populate("pet");

    res.status(201).json(populatedAdoption);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error creating adoption request" });
  }
});

// GET all adoptions
router.get("/adoptions", isAuthenticated, async (req, res) => {
  try {
    const adoptions = await Adoption.find()
      .populate("user", "username email profilePicture")
      .populate("pet")
      .sort({ createdAt: -1 });

    res.status(200).json(adoptions);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Error fetching adoptions" });
  }
});

module.exports = router;
