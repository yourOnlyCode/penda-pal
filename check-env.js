// Quick script to check if DATABASE_URL is being read
require('dotenv').config({ path: '.env' })

console.log('Checking environment variables...')
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
if (process.env.DATABASE_URL) {
  // Hide password for security
  const url = process.env.DATABASE_URL
  const masked = url.replace(/:([^:@]+)@/, ':****@')
  console.log('DATABASE_URL:', masked)
} else {
  console.log('❌ DATABASE_URL not found!')
  console.log('Make sure:')
  console.log('1. .env file exists in the project root')
  console.log('2. DATABASE_URL is set in .env')
  console.log('3. No extra spaces around the = sign')
  console.log('4. The value is wrapped in quotes if it contains special characters')
}

