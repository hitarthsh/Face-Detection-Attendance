const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Get internal IPv4 address
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

const ip = getLocalIP();
const PORT = 5000;
const apiUrl = `http://${ip}:${PORT}/api`;

console.log("🔗 Connecting Backend to Frontend...");
console.log(`📡 Detected Local IP: ${ip}`);

// 1. Update Frontend API Configuration
const apiConfigPath = path.join(
  __dirname,
  "frontend",
  "src",
  "services",
  "api.ts",
);
if (fs.existsSync(apiConfigPath)) {
  let content = fs.readFileSync(apiConfigPath, "utf8");

  // Replace the BASE_URL logic with dynamic IP
  const updatedContent = content.replace(
    /const BASE_URL = __DEV__[\s\S]*?: 'https:\/\/your-production-api\.com\/api';/,
    `const BASE_URL = __DEV__\n  ? '${apiUrl}' // Auto-detected: ${ip}\n  : 'https://your-production-api.com/api';`,
  );

  fs.writeFileSync(apiConfigPath, updatedContent);
  console.log(`✅ Updated Frontend API URL to: ${apiUrl}`);
} else {
  console.log(`❌ Frontend API file not found at: ${apiConfigPath}`);
}

// 2. Check Backend .env
const envPath = path.join(__dirname, "backend", ".env");
const envExamplePath = path.join(__dirname, "backend", ".env.example");

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log("✅ Created backend .env from .env.example");
} else if (fs.existsSync(envPath)) {
  console.log("✅ Backend .env already exists");
}

// 3. Create Admin User Utility
console.log("\n--- Next Steps ---");
console.log("1. Start Backend: cd backend && npm run dev");
console.log("2. Start Frontend: cd frontend && npm start");
console.log(`3. Create Admin: Run the following command after backend starts:`);
console.log(`   curl -X POST ${apiUrl}/auth/register \\`);
console.log(`     -H "Content-Type: application/json" \\`);
console.log(
  `     -d "{\\\"name\\\":\\\"Admin\\\",\\\"email\\\":\\\"shahh0919@gmail.com\\\",\\\"password\\\":\\\"Hitarth@11\\\",\\\"role\\\":\\\"admin\\\"}"`,
);
console.log("\n------------------");
