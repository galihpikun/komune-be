import express from "express"
import cors from "cors"
import routeAuth from "./src/routes/authRoute.js"
import routeUser from "./src/routes/userRoute.js"
import routerForum from "./src/routes/forumRoute.js"
import routerForumMember from "./src/routes/forumMemberRoute.js"
import routerPost from "./src/routes/postRoute.js"

const app = express()
const port = 3000

app.use(express.json());
app.use(cors());

// Route uploaded images
app.use("/uploads", express.static("uploads"));

app.use("/api/posts", routerPost);
app.use("/api/forum-members", routerForumMember);
app.use("/api/auth", routeAuth);
app.use("/api/users", routeUser);
app.use("/api/forums", routerForum);

app.get('/', (req, res) => {
  res.send('Welcome to Komune API!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
