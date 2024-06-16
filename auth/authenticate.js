const User = require("../models/user.model.js");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');


function createSecretToken(id) {
    console.log(id);
    return jwt.sign({ id }, process.env.TOKEN_KEY, {
        expiresIn: "1h"
    });
}

module.exports.middleware = (req, res) => {
    console.log("Middleware");
    const cookieString = req.headers["cookie"];

    if (!cookieString) {
        console.log("No cookie string found");
        return res.status(401).send("Unauthorized");
    }

    const cookies = cookieString.split("; ");
    const tokenCookie = cookies.find(cookie => cookie.startsWith("token="));

    console.log(tokenCookie);

    if (!tokenCookie) {
        console.log("No token cookie found");
        return res.status(401).send("Unauthorized");
    }

    const token = tokenCookie.split("=")[1];
    console.log(token);

    if (token) {
        jwt.verify(token, process.env.TOKEN_KEY, (err) => {
            if (err) {
                console.log(err);
                return res.status(403).send("Unauthorized");
            } else {
                console.log("Middleware Success");
                return res.status(200).send("Authorized");
            }
        });
    } else {
        return res.status(401).send("Unauthorized");
    }
};

module.exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        console.log(user);
        if (user) {
            if (user.user_type === 1) {
                if (bcrypt.compareSync(password, user.password)) {
                    const token = createSecretToken(user._id);
                    console.log(token);
                    res.status(201).json({ message: "Login Success", success: true, jwttoken: token, user:user });
                } else {
                    res.json({ message: "Wrong Password" });
                }
            }
            else{
                res.json({message:"You are not authorished to access the panel"});
            }
        } else {
            res.json({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
    }
};

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        console.log(user);
        if (user) {
            // if (user.user_type === 2) {
                if (bcrypt.compareSync(password, user.password)) {
                    const token = createSecretToken(user._id);
                    console.log(token);
                    res.status(201).json({ message: "Login Success", success: true, jwttoken: token, user:user });
                } else {
                    res.json({ message: "Wrong Password" });
                }
            // }
            // else{
            //     res.json({message:"You are not authorished to access the panel"});
            // }
        } else {
            res.json({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
    }
};

module.exports.logout = (req,res)=>{
    res.clearCookie("token");
    res.json({ logout: true });
};