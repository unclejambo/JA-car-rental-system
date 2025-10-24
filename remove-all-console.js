const fs = require("fs");
const path = require("path");

const filesToProcess = [
  // Backend files
  "./backend/cleanup-booking-49.js",

  // Frontend context files
  "./frontend/src/contexts/AuthContext.jsx",

  // Frontend component files
  "./frontend/src/ui/components/modal/ProtectedRoute.jsx",

  // Frontend page files
  "./frontend/src/pages/LoginPage.jsx",
  "./frontend/src/pages/admin/AdminTransactionPage.jsx",
];

function removeConsoleLogs(content) {
  // Remove single-line console statements
  let result = content.replace(
    /^\s*console\.(log|error|warn|info|debug)\(.*?\);?\s*$/gm,
    ""
  );

  // Remove commented console statements (already commented)
  result = result.replace(
    /^\s*\/\/\s*console\.(log|error|warn|info|debug)\(.*?\);?\s*$/gm,
    ""
  );

  // Clean up multiple consecutive blank lines (leave max 2)
  result = result.replace(/\n\s*\n\s*\n+/g, "\n\n");

  return result;
}

let filesProcessed = 0;
let totalConsoleRemoved = 0;

filesToProcess.forEach((filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipped (not found): ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const originalLines = content.split("\n").length;

    // Count console statements
    const consoleCount = (
      content.match(/^\s*\/?\/?\s*console\.(log|error|warn|info|debug)\(/gm) ||
      []
    ).length;

    if (consoleCount === 0) {
      console.log(`✓ No console statements: ${filePath}`);
      return;
    }

    const newContent = removeConsoleLogs(content);
    const newLines = newContent.split("\n").length;

    fs.writeFileSync(filePath, newContent, "utf8");

    filesProcessed++;
    totalConsoleRemoved += consoleCount;

    console.log(`✅ ${filePath}`);
    console.log(`   Removed ${consoleCount} console statement(s)`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n${"=".repeat(50)}`);
console.log(`✨ Processing complete!`);
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Console statements removed: ${totalConsoleRemoved}`);
console.log(`${"=".repeat(50)}\n`);
