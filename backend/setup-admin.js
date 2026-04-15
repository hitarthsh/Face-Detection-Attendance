"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const env = require("./config/env");

const MONGODB_URI = env.MONGODB_URI || "mongodb://localhost:27017/face_attendance";

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

    const adminEmail = "shahh0919@gmail.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
      const hashedPassword = await bcrypt.hash("admin@123", 12);
      await User.updateOne({ email: adminEmail }, { password: hashedPassword });
      console.log("✅ Admin password updated successfully!");
    } else {
      const hashedPassword = await bcrypt.hash("admin@123", 12);

      await User.create({
        name: "Super Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });

      console.log("✅ Admin user created successfully!");
      console.log(`📧 Email: ${adminEmail}`);
      console.log("🔑 Password: admin@11");
    }
  } catch (error) {
    console.error("❌ Error setting up admin:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

setupAdmin();
