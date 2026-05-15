import express from "express"
import cors from "cors"
import routeAuth from "./src/routes/authRoute.js"
import routeUser from "./src/routes/userRoute.js"
import routerPost from "./src/routes/postRoute.js"
import routerComment from "./src/routes/commentRoute.js"

import routerPostReaction from "./src/routes/postReactRoute.js"
import routerReport from "./src/routes/reportRoute.js"


// delete!
import { jwtMiddleware } from "./src/middlewares/jwtMiddleware.js"

const app = express()
const port = 3000

app.use(express.json());
app.use(cors());

// Route uploaded images
app.use("/uploads", express.static("uploads"));

app.use("/api/reports", routerReport);

app.use("/api/post-reactions", routerPostReaction);
app.use("/api/comments", routerComment);
app.use("/api/posts", routerPost);
app.use("/api/auth", routeAuth);
app.use("/api/users", routeUser);

app.get('/', (req, res) => {
  res.send('Welcome to Komune API!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
