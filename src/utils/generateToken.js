import jwt from "jsonwebtoken";

export const generateToken = (params, res) => {
    const payload = {id: params.id, email: params.email, username: params.username};
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    })

    res.cookie("jwt", token, {
        httpOnly:true,
        sameSite: "strict",
        maxAge : (1000 * 60 * 60 * 24) * 7,
    })
    return token;
}