import express from "express";
import { doctorList, loginDoctor, appointmentsDoctor, appointmentCompleted, appointmentCancel } from "../controllers/doctorController.js";
import authDoctor from "../middlewares/authDoctor.js";

const doctorRouter = express.Router();

doctorRouter.get('/list', doctorList);
doctorRouter.post('/login', loginDoctor);
doctorRouter.get('/appointments',authDoctor, appointmentsDoctor);
doctorRouter.post('/completed-appointment',authDoctor, appointmentCompleted);
doctorRouter.post('/cancel-appointment',authDoctor, appointmentCancel);

export default doctorRouter;