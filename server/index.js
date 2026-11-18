// i added this, bcs i cant run the server locally
const dns = require('node:dns/promises')
dns.setServers(['8.8.8.8', '1.1.1.1'])

const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const {
  routeNotFoundHandler,
  globalErrorHandler
} = require('./middlewares/errorHandler')

require('dotenv').config()
require('colors')

const PORT = process.env.PORT || 5000

// connect to datebase
connectDB()

// middleware
const app = express()

const corsOptions = {
  origin: ['syngenta-monitoring.vercel.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))

// handles preflight for all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin)
    res.header(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,DELETE,PATCH,OPTIONS'
    )
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    res.header('Access-Control-Allow-Credentials', 'true')
    return res.sendStatus(204)
  }
  next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// routes
app.use('/api/user', require('./routes/userRoute'))
app.use('/api/driver', require('./routes/driverRoute'))
app.use('/api/truck', require('./routes/truckRoute'))
app.use('/api/deployment', require('./routes/deploymentRoute'))
app.use('/api/analytics', require('./routes/dashboardRoute'))
app.use('/api/activity-logs', require('./routes/activityLogRoute'))
app.use('/api/timeline-logs', require('./routes/timelineRoute'))
app.use('/api/system-settings', require('./routes/systemSettingsRoute'))

// error-handling middleware
app.use(routeNotFoundHandler)
app.use(globalErrorHandler)

console.log(new Date())

// start server
app.listen(PORT, () =>
  console.log(`Server running on port: ${PORT}`.yellow.underline)
)
