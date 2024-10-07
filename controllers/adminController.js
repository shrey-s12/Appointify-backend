import validator from 'validator';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';

// API for adding doctor
const addDoctor = async (req, res) => {

    try {
        const { name, email, password, speciality, degree, experience, about, available, fees, address } = req.body;
        const imageFile = req.file;

        // console.log( { name, email, password, speciality, degree, experience, about, available, fees, address }, imageFile);

        // if any field is empty
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email" });
        }

        // validating password
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be atleast 6 characters" });
        }

        // hashing password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        // uploading image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url;

        const doctorData = new doctorModel({
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            available,
            fees,
            address: JSON.parse(address),
            date: Date.now()
        });


        // saving doctor to database
        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        res.status(201).json({ success: true, message: "Doctor added successfully" });

    } catch (error) {
        res.json({ success:false, message: error.message });
    }
}

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET);
            res.json({ success: true, message: "Login successful", token });
        }
        else {
            res.json({ success: false, message: "Invalid Credentials" });
        }

    } catch (error) {
        res.json({ success:false, message: error.message });
    }
}

// API for getting all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select("-password");
        res.json({ success: true, doctors });
    } catch (error) {
        res.json({ success:false, message: error.message });
    }
}

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({});
        res.json({ success: true, appointments });
    } catch (error) {
        res.json({ success:false, message: error.message });
    }
}

export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin };