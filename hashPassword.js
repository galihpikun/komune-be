import bcrypt from "bcrypt";

const password = "owner123";

const hashedPassword = await bcrypt.hash(password, 10);

console.log(hashedPassword);