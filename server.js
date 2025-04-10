const app = require('./app')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

app.listen(process.env.PORT, '0.0.0.0', () => {
    // console.log(`server is running at http://localhost:${process.env.PORT}`)
    console.log(`server is running at port:${process.env.PORT}`)
})
