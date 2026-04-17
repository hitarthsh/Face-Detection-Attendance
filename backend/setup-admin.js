"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const env = require("./config/env");

const MONGODB_URI = env.MONGODB_URI;

async function setupAdmin() {
  try {
    console.log("⏳ Connecting to MongoDB...");

    await mongoose.connect(MONGODB_URI);

    console.log("✅ Connected to MongoDB");

    const UserSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: { type: String },
      role: { type: String, default: "admin" },
      isActive: { type: Boolean, default: true },
    });

    const User = mongoose.models.User || mongoose.model("User", UserSchema);

    const adminEmail = "software@cusmc.org";
    const adminPassword = "software@123";
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Keep only the requested admin credentials in the users collection.
    await User.deleteMany({});
    await User.create({
      name: "Software Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("✅ Existing users removed and new admin created successfully!");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
  } catch (error) {
    console.error("❌ Error setting up admin:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

setupAdmin();
