import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";


const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body;
        const docData = await doctorModel.findById(docId);
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });
        res.json({ success: true, message: "Availability changed successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(["-password", "-email"]);
        res.json({ success: true, doctors });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// API for Doctor Login
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body;
        const doctor = await doctorModel.findOne({ email })

        if (!doctor) {
            return res.json({ success: false, message: "Invalid Credentials" });
        }

        const isMatch = await bcrypt.compare(password, doctor.password);

        if (isMatch) {
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
            return res.json({ success: true, token });
        }
        else {
            return res.json({ success: false, message: "Invalid Credentials" });
        }

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel.find({ docId });

        res.json({ success: true, appointments });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// API to mark appointment completed for doctor panel
const appointmentCompleted = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId == docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
            return res.json({ success: true, message: "Appointment completed successfully" });
        } else {
            return res.json({ success: false, message: "Mark Failed" });
        }
    }
    catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// API to Cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId == docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
            return res.json({ success: true, message: "Appointment cancelled successfully" });
        } else {
            return res.json({ success: false, message: "Cancelled Failed" });
        }
    }
    catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body;

        const appointments = await appointmentModel.find({ docId });

        let earning = 0;

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earning += item.amount;
            }
        });

        let patient = [];

        appointments.map((item) => {
            if (!patient.includes(item.userId)) {
                patient.push(item.userId);
            }
        });

        const dashData = {
            earning,
            appointments: appointments.length,
            patients: patient.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        }

        res.json({ success: true, dashData });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// API to get doctor profile for Doctor Panel
const doctorProfile = async (req, res) => {
    try {
        const { docId } = req.body;
        const profileData = await doctorModel.findById(docId).select(["-password"]);
        res.json({ success: true, profileData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// API to udpate doctor profile for Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {
        const { docId, fees, address, available } = req.body;
        await doctorModel.findByIdAndUpdate(docId, { fees, address, available });
        res.json({ success: true, message: "Profile Updated Successfully" });
    }
    catch (error) {
        res.json({ success: false, message: error.message });
    }
}


export {
    changeAvailability,
    doctorList,
    loginDoctor,
    appointmentsDoctor,
    appointmentCompleted,
    appointmentCancel,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile
}