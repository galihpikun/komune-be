import express from "express"
import cors from "cors"
import routeAuth from "./src/routes/authRoute.js"

const app = express()
const port = 3000

app.use(express.json());
app.use(cors());

app.use("/api/auth", routeAuth);

app.get('/', (req, res) => {
  res.send('Welcome to Komune API!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
