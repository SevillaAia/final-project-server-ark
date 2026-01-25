const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const UserModel = require("../models/User.model");

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/the-ark";

// Admin user credentials - CHANGE THESE IN PRODUCTION!
const ADMIN_USER = {
  username: "Admin",
  email: "admin@theark.com",
  password: "Admin123!", // Change this password!
  role: "Admin",
  status: "Active",
};

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ email: ADMIN_USER.email });

    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      console.log("If you need to reset the admin, delete the user first.");
    } else {
      // Hash the password
      const salt = bcryptjs.genSaltSync(12);
      const hashedPassword = bcryptjs.hashSync(ADMIN_USER.password, salt);

      // Create admin user
      const adminUser = await UserModel.create({
        ...ADMIN_USER,
        password: hashedPassword,
      });

      console.log("✅ Admin user created successfully!");
      console.log("   Email:", adminUser.email);
      console.log("   Username:", adminUser.username);
      console.log("   Role:", adminUser.role);
      console.log("\n⚠️  Remember to change the default password!");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

seedAdmin();
