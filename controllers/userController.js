import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";


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

// API to update user profile details
const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        if (!name || !phone || !gender || !dob) {
            return res.status(400).json({ success: false, message: "Please fill all fields" });
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender });

        if (imageFile) {

            // uploading image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            const imageUrl = imageUpload.secure_url;
            await userModel.findByIdAndUpdate(userId, { image: imageUrl });
        }

        res.json({ success: true, message: "Profile updated successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// API to book an appointment
const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body;

        const docData = await doctorModel.findById(docId).select("-password");

        if (!docData.available) {
            return res.json({ success: false, message: "Doctor not available" });
        }

        let slots_booked = docData.slots_booked;

        // checking for slot availability
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: "Slot not available" });
            }
            else {
                slots_booked[slotDate].push(slotTime);
            }
        } else {
            slots_booked[slotDate] = [];
            slots_booked[slotDate].push(slotTime);
        }

        const userData = await userModel.findById(userId).select("-password");

        delete docData.slots_booked;

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();


        // Save new slots booked data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        res.json({ success: true, message: "Appointment booked successfully" });

    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// API to get user's appointments
const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body;
        const appointments = await appointmentModel.find({ userId });
        res.json({ success: true, appointments });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// API to cancel an appointment
const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

        // verify appointment user
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // Remove slot from doctor's slots_booked
        const { docId, slotDate, slotTime } = appointmentData;

        const doctorData = await doctorModel.findById(docId);

        let slots_booked = doctorData.slots_booked;

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

        await doctorModel.findByIdAndUpdate(docId, { slots_booked });


        res.json({ success: true, message: "Appointment cancelled successfully" });

    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// const razorpayInstance = new razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET
// })


// API to make payment for an appointment using Razorpay
// const paymentrazorpay = async (req, res) => {
// }

export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment }