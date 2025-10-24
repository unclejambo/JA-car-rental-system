const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Get all .js files in backend (excluding node_modules)
function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .git directories
      if (file !== "node_modules" && file !== ".git" && file !== "prisma") {
        getAllJsFiles(filePath, fileList);
      }
    } else if (file.endsWith(".js")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function removeConsoleLogs(content) {
  let result = content;

  // Remove single-line console statements (simple cases)
  result = result.replace(
    /^\s*console\.(log|error|warn|info|debug)\([^;]*\);?\s*$/gm,
    ""
  );

  // Remove commented console statements (already commented)
  result = result.replace(
    /^\s*\/\/\s*console\.(log|error|warn|info|debug)\(.*?\);?\s*$/gm,
    ""
  );

  // Handle multi-line console statements more carefully
  // This regex looks for console.log( and matches until the closing );
  result = result.replace(
    /console\.(log|error|warn|info|debug)\([^)]*(?:\([^)]*\)[^)]*)*\);?/g,
    ""
  );

  // Clean up multiple consecutive blank lines (leave max 2)
  result = result.replace(/\n\s*\n\s*\n+/g, "\n\n");

  // Clean up trailing whitespace on empty lines
  result = result.replace(/^[ \t]+$/gm, "");

  return result;
}

console.log("🔍 Scanning for JavaScript files...\n");

const backendFiles = getAllJsFiles("./backend");

console.log(`Found ${backendFiles.length} JavaScript files in backend\n`);

let filesProcessed = 0;
let totalConsoleRemoved = 0;
let errors = [];

backendFiles.forEach((filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Count console statements
    const consoleMatches = content.match(
      /console\.(log|error|warn|info|debug)\(/g
    );
    const consoleCount = consoleMatches ? consoleMatches.length : 0;

    if (consoleCount === 0) {
      return; // Skip files with no console statements
    }

    const newContent = removeConsoleLogs(content);
    fs.writeFileSync(filePath, newContent, "utf8");

    filesProcessed++;
    totalConsoleRemoved += consoleCount;

    const relativePath = path.relative(".", filePath);
    console.log(`✅ ${relativePath}`);
    console.log(`   Removed ${consoleCount} console statement(s)\n`);
  } catch (error) {
    errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log("=".repeat(60));
console.log("✨ Backend Processing Complete!");
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Console statements removed: ${totalConsoleRemoved}`);
if (errors.length > 0) {
  console.log(`   Errors: ${errors.length}`);
}
console.log("=".repeat(60));
