const mongoose = require('mongoose')
const dns = require('node:dns')

async function resolveMongoSrv(connectionString) {
  if (!connectionString.startsWith('mongodb+srv://')) return

  const hostname = new URL(connectionString).hostname
  const srvRecord = `_mongodb._tcp.${hostname}`

  try {
    await dns.promises.resolveSrv(srvRecord)
  } catch (systemDnsError) {
    const systemServers = dns.getServers()
    const fallbackServers = (process.env.MONGODB_DNS_SERVERS || '1.1.1.1,8.8.8.8')
      .split(',')
      .map((server) => server.trim())
      .filter(Boolean)

    try {
      dns.setServers(fallbackServers)
      await dns.promises.resolveSrv(srvRecord)
      console.warn(`System DNS could not resolve MongoDB SRV; using ${fallbackServers.join(', ')}.`)
    } catch (fallbackDnsError) {
      dns.setServers(systemServers)
      throw new Error(`MongoDB SRV lookup failed with system DNS (${systemDnsError.code || systemDnsError.message}) and fallback DNS (${fallbackDnsError.code || fallbackDnsError.message}).`)
    }
  }
}

async function connectDatabase() {
  const connectionString = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL
  if (!connectionString) {
    throw new Error('MONGODB_URI is missing. Create server/.env from server/.env.example and set your MongoDB connection string.')
  }

  await resolveMongoSrv(connectionString)
  await mongoose.connect(connectionString, { serverSelectionTimeoutMS: 5000 })
  console.log('Connected to MongoDB')
}

module.exports = connectDatabase