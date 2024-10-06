import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";


// API to register a user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // if any field is empty
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Please fill all fields" });
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email" });
        }

        // validating password
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be atleast 6 characters" });
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        // saving user to database
        const userData = {
            name,
            email,
            password: hashedPassword
        };

        const newUser = new userModel(userData);
        const user = await newUser.save();

        // Create a token for the user 
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({ success: true, message: "User registered successfully", token });

    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}


// API for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please fill all fields" });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "User does not exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Password does not match" });
        }

        // Create a token for the user 
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({ success: true, message: "User logged in successfully", token });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// API to get user profile details
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const userData = await userModel.findById(userId).select("-password");
        res.json({ success: true, userData });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}



export { registerUser, loginUser, getProfile }