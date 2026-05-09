import express from "express"
import cors from "cors"
import routeAuth from "./src/routes/authRoute.js"
import routeUser from "./src/routes/userRoute.js"

const app = express()
const port = 3000

app.use(express.json());
app.use(cors());

app.use("/api/auth", routeAuth);
app.use("/api/users", routeUser);

app.get('/', (req, res) => {
  res.send('Welcome to Komune API!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
