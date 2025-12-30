// Script to help fix DATABASE_URL format
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let found = false;
const newLines = lines.map(line => {
  if (line.trim().startsWith('DATABASE_URL=')) {
    found = true;
    
    // Extract the connection string
    let url = line.split('=').slice(1).join('=').trim();
    
    // Remove quotes if present
    if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
      url = url.slice(1, -1);
    }
    
    // Check if password has @ symbols that need encoding
    const match = url.match(/postgresql:\/\/postgres:([^@]+)@/);
    if (match) {
      const password = match[1];
      if (password.includes('@') && !password.includes('%40')) {
        // Password has @ symbols that need encoding
        const encodedPassword = password.replace(/@/g, '%40');
        const newUrl = url.replace(`:${password}@`, `:${encodedPassword}@`);
        console.log('✅ Fixed DATABASE_URL - encoded @ symbols in password');
        console.log('Old:', url.substring(0, 50) + '...');
        console.log('New:', newUrl.substring(0, 50) + '...');
        return `DATABASE_URL="${newUrl}"`;
      } else if (password.includes('%40')) {
        console.log('✅ DATABASE_URL already has URL-encoded password');
        return line;
      }
    }
    
    return line;
  }
  return line;
});

if (!found) {
  console.error('❌ DATABASE_URL not found in .env file!');
  process.exit(1);
}

// Write back to file
fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
console.log('\n✅ .env file updated!');
console.log('\n⚠️  IMPORTANT: Now do the following:');
console.log('1. Stop your dev server (Ctrl+C)');
console.log('2. Run: npx prisma generate');
console.log('3. Run: npm run dev');

