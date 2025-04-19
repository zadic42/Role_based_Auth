const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')
const authRoutes = require('./routes/auth')
const auditLogRoutes = require('./routes/auditLogs')
const errorLogRoutes = require('./routes/errorLogs')
const systemPerformanceRoutes = require('./routes/systemPerformance')
const auditLog = require('./middleware/auditLog')
const { startMetricsCollection } = require('./services/systemPerformanceService')

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(auditLog)

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    
    // Start the system performance metrics collection service
    // Collect metrics every 5 minutes
    startMetricsCollection(5)
  })
  .catch((err) => console.error('MongoDB connection error:', err))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/error-logs', errorLogRoutes)
app.use('/api/system-performance', systemPerformanceRoutes)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
}) 