const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser")
const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


// doctor routers import
const doctorRouter = require("./Routes/Doctor.Routes")
// Auth routes Import
const authroute = require("./Routes/auth.Routes");
// AppFeedback routes import
const AppFeedbackRoutes = require("./Routes/AppFeedback.Routes");
// Patient routers import
const PatientRoute = require("./Routes/Patient.Routes");
// patientDoctor connection route import
const PatientDoctorConnection = require('./Routes/PatientDoctorConnection.Routes');
// Appointment routes import
const AppointmentRoute = require("./Routes/Appointment.Routes");
//All Type Questions Routes import
const PatientAllTypeQuestions = require('./Routes/PatientAllTypeQuestions.Routes');
//Patient Health Record Routes import
const PatientHealthRecord = require('./Routes/PatientHealthRecord.Routes');
// App feedback patient route import
const AppFeedback = require('./Routes/AppFeedback.Routes');

const socketIo = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
io.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    // Listen for chat messages
    socket.on("sendMessage", (message) => {
        console.log("Message received from user: ", message);
        // Broadcast the message to all connected clients except the sender
        socket.broadcast.emit("receiveMessage", message);
    });

    // Listen for user disconnect
    socket.on("disconnect", () => {
        console.log("A user disconnected: ", socket.id);
    });
});
// Default 
app.get("/", (req, res) => {
    res.send("<h1>welcome to BreastCancer</h1>");
});
// Doctor Routes declearations
app.use("/api/v1/doctor", doctorRouter);//updated
//auth route(both):
app.use("/api/v1/auth", authroute); //updated
// Patient Routes declereations
app.use("/api/v1/patient", PatientRoute)//updated
// patientDoctor connection route declearations
app.use("/api/v1/PatientDoctorConnection", PatientDoctorConnection)//updated
// AppFeedback route decleration
app.use("/api/v1/feedback", AppFeedbackRoutes);
// Appointment routes declearation
app.use("/api/v1/appointments", AppointmentRoute);
// All Type Questions declearation
app.use('/api/v1/patient/questions', PatientAllTypeQuestions);
// Patient Health Record declearation
app.use('/api/v1/health', PatientHealthRecord);
// App feedback patient route declearation
app.use('/api/v1/feedback', AppFeedback);

module.exports = app;