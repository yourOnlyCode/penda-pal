// Quick script to test database connection
// Run with: node test-db-connection.js

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query test successful!', result)
  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error(error.message)
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 Tips:')
      console.log('1. Check your DATABASE_URL in .env file')
      console.log('2. Make sure the password is correct')
      console.log('3. If password has special characters, URL-encode them:')
      console.log('   @ → %40')
      console.log('   # → %23')
      console.log('   $ → %24')
      console.log('   % → %25')
      console.log('   & → %26')
      console.log('   + → %2B')
      console.log('   = → %3D')
      console.log('   ? → %3F')
      console.log('   / → %2F')
      console.log('   (space) → %20')
      console.log('\n4. Get the connection string from Supabase:')
      console.log('   Settings > Database > Connection string (URI)')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

