const express = require("express");
const router = express.Router();
const Appointment = require("../Models/CreateAppointmentSchema");
const authenticateToken = require('../Middlewares/auth.middleware');
const BookAppointment = require('../Models/bookedAppointmentSchema');
const Doctor = require('../Models/DoctorSchema'); // Adjust the path as needed
const mongoose = require("mongoose");

// POST: Create a new appointment slot (Doctor's side)
router.post("/doctor/create", authenticateToken, async (req, res) => {
  const { date, endTime, startTime, place } = req.body;
  // console.log(req.body);
  // Check if all fields are provided
  if (!date || !endTime || !startTime || !place) {
    return res
      .status(400)
      .json({ message: "All fields (date, time, place) are required" });
  }

  try {
    // Check if an appointment with the same date, time, and place already exists
    const existingAppointment = await Appointment.findOne({ date, endTime, startTime, place, doctorId: req.user._id });

    if (existingAppointment) {
      return res.status(400).json({ message: "An appointment at this date, time, and place already exists." });
    }
    // If no existing appointment, create a new one
    const appointment = new Appointment({
      doctorId: req.user._id,
      date,
      endTime,
      startTime,
      place,
      ActiveStatus: true
    });

    await appointment.save();
    res.status(201).json({ message: "Appointment slot created", appointment });

  } catch (error) {
    console.error("Error saving appointment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
// post: feedback post
router.post("/Doctor/create/feedback", authenticateToken, async (req, res) => {
  let { appointmentCreatedId, feedbackrating } = req.body;
  const doctorId = req.user._id;
  try {
    // Check if the appointment exists for the given date and patientId
    const existingAppointment = await Appointment.findOne({ doctorId, _id: appointmentCreatedId });
    if (!existingAppointment) {
      return res.status(404).json({ message: "Appointment not exist" });
    }
    // Update feedback rating in the appointment
    existingAppointment.feedbackrating = feedbackrating;
    await existingAppointment.save();
    res.status(200).json({
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
//resedule Appointment route
router.post("/doctor/resedule", authenticateToken, async (req, res) => {
  const { appointmentCreatedId, date, startTime, endTime, place } = req.body;
  const doctorId = req.user._id;
  // Check if all fields are provided
  if (!appointmentCreatedId || !date || !startTime || !endTime || !place) {
    return res.status(400).json({
      message: "All fields (appointmentCreatedId,date, startTime,endTime, place) are required",
    });
  }
  try {
    // Check if the appointment already exists
    const existingAppointment = await Appointment.findOne({
      _id: appointmentCreatedId,
      doctorId,
    });
    if (!existingAppointment) {
      return res.status(409).json({ message: "Appointment already cancel" });
    }

    // Update the Appointment
    const reseduleAppointment = await Appointment.findOneAndUpdate(
      { _id: appointmentCreatedId, doctorId },
      {
        ActiveStatus: true,
        date,
        startTime,
        endTime,
        place
      },
      { new: true, runValidators: true }
    );

    console.log("Appointment resedule successfully")
    res.status(200).json({
      message: "Appointment resedule successfully",
      appointment: reseduleAppointment,
    });
  } catch (error) {
    console.error("Error resedule appointment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
// GET: Retrieve all booked upcoming appointments for the doctor
router.get("/doctor/upcoming", authenticateToken, async (req, res) => {
  const doctorId = req.user._id; // Get doctorId from req.query
  try {
    // Fetch confirmed appointments based on the query
    const confirmedAppointments = await Appointment.find({ doctorId, ActiveStatus: true });

    const BookedAppointments = await BookAppointment.find({ doctorId, bookingStatus: 'booked' });
    // console.log(confirmedAppointments)
    res.status(200).json({
      appointments: confirmedAppointments,
      BookedAppointments: BookedAppointments,
    });
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
//cancel Appointment route from doctor
router.post("/doctor/cancel", authenticateToken, async (req, res) => {
  const { appointmentCreatedId } = req.body;
  const doctorId = req.user._id;

  if (!appointmentCreatedId) {
    return res.status(400).json({
      message: "appointmentCreatedId are required",
    });
  }
  try {
    // Check if the appointment exists and is in 'booked' status
    const existingAppointment = await Appointment.findOne({
      _id: appointmentCreatedId,
      doctorId,
      ActiveStatus: true,
    });
    if (!existingAppointment) {
      return res.status(404).json({ message: "Appointment not found or already canceled" });
    }
    // Update the status to 'cancel'
    const canceledAppointment = await Appointment.findOneAndUpdate(
      { _id: appointmentCreatedId, doctorId },
      { ActiveStatus: false },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      message: "Appointment canceled successfully",
      appointment: canceledAppointment,
    });
  } catch (error) {
    console.error("Error canceling appointment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


// GET: Retrieve available appointment slots for patients to book
router.get("/available", authenticateToken, async (req, res) => {
  const { doctorId } = req.query; // Get doctorId from req.query

  // Check if doctorId is provided
  if (!doctorId) {
    return res.status(400).json({ message: "Doctor ID is required" });
  }

  try {
    // Search for appointments related to the provided doctorId
    const availableAppointments = await Appointment.find({ doctorId });
    // console.log(availableAppointments)
    res.status(200).json(availableAppointments);
  } catch (error) {
    console.error("Error fetching available appointments:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
// post: Book an appointment slot (Patient's side)
router.post("/book", authenticateToken, async (req, res) => {
  const { appointmentCreatedId, doctorId, date, startTime, endTime, place } = req.body;
  const patientId = req.user._id;

  // Check if all fields are provided
  if (!appointmentCreatedId || !doctorId || !date || !startTime || !endTime || !place) {
    return res.status(400).json({
      message: "All fields (appointmentCreatedId, doctorId, date, startTime, endTime, place) are required",
    });
  }

  try {
    // Check if the appointment already exists
    const existingAppointment = await BookAppointment.findOne({
      appointmentCreatedId,
      patientId,
    });

    if (existingAppointment) {
      if (existingAppointment.bookingStatus === 'cancel') {
        existingAppointment.bookingStatus = 'booked';
        await existingAppointment.save(); // Added `await` here
        return res.status(201).json({ message: "Appointment rebooked" });
      }
      return res.status(409).json({ message: "Appointment already booked" });
    }

    // Create a new appointment record
    const newAppointment = new BookAppointment({
      appointmentCreatedId,
      doctorId,
      patientId,
      date,
      startTime,
      endTime,
      place,
      bookingStatus: 'booked',
    });

    // Save the new appointment to the database
    await newAppointment.save();
    res.status(200).json({
      message: "Appointment booked successfully",
      appointment: newAppointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
// post: feedback post
router.post("/book/feedback", authenticateToken, async (req, res) => {
  let { appointmentCreatedId, feedbackrating } = req.body;
  const patientId = req.user._id;
  try {
    // Check if the appointment exists for the given date and patientId
    const existingAppointment = await BookAppointment.findOne({ patientId, appointmentCreatedId });
    if (!existingAppointment) {
      return res.status(404).json({ message: "Appointment not exist" });
    }
    // Update feedback rating in the appointment
    existingAppointment.feedbackrating = feedbackrating;
    await existingAppointment.save();
    res.status(200).json({
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
//cancel Appointment route
router.post("/cancel", authenticateToken, async (req, res) => {
  const { appointmentCreatedId } = req.body;
  const patientId = req.user._id || req.body.patientId;
  const doctorId = req.body.doctorId || req.user._id;

  if (!appointmentCreatedId || !doctorId) {
    return res.status(400).json({
      message: "All fields (appointmentCreatedId, doctorId) are required",
    });
  }
  try {
    // Check if the appointment exists and is in 'booked' status
    const existingAppointment = await BookAppointment.findOne({
      appointmentCreatedId,
      patientId,
      doctorId,
      bookingStatus: 'booked',
    });

    if (!existingAppointment) {
      return res.status(404).json({ message: "Appointment not found or already canceled" });
    }
    // Update the status to 'cancel'
    const canceledAppointment = await BookAppointment.findOneAndUpdate(
      { appointmentCreatedId, patientId, doctorId },
      { bookingStatus: 'cancel' },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Appointment canceled successfully",
      appointment: canceledAppointment,
    });
  } catch (error) {
    console.error("Error canceling appointment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
// GET: Retrieve all booked upcoming appointments for the patient
router.get("/patient/upcoming", authenticateToken, async (req, res) => {
  const { doctorId } = req.query; // Get doctorId from req.query
  const patientId = req.user._id;
  try {
    // Build query conditionally based on doctorId's presence
    const query = doctorId ? { patientId, doctorId, bookingStatus: 'booked' } : { patientId, bookingStatus: 'booked' };

    // Fetch confirmed appointments based on the query
    const confirmedAppointments = await BookAppointment.find(query);

    // If a specific doctorId is provided, fetch the doctor details once
    let doctorDetails = null;
    if (doctorId) {
      doctorDetails = await Doctor.findOne({ doctorId: doctorId });
    } else {
      // If no specific doctorId, fetch details for each unique doctor in appointments
      const doctorIds = [...new Set(confirmedAppointments.map(app => app.doctorId.toString()))];
      const doctorDetailsMap = await Doctor.find({ doctorId: { $in: doctorIds } }).then(docs =>
        docs.reduce((acc, doc) => {
          acc[doc.doctorId.toString()] = doc;
          return acc;
        }, {})
      );

      // Add doctor details to each appointment in the response
      confirmedAppointments.forEach(app => {
        app._doc.doctorDetails = doctorDetailsMap[app.doctorId.toString()] || null;
      });
    }
    res.status(200).json({
      appointments: confirmedAppointments,
      doctorDetails: doctorDetails,
    });
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    res.status(500).json({ message: "Server error", error });
  }
});



// GET: get statistic appointments for the doctor
// Doctor statistics route
router.get("/doctor/statistic", authenticateToken, async (req, res) => {
  const doctorId = req.user._id;

  try {
    const statistics = await BookAppointment.aggregate([
      {
        $match: { doctorId: new mongoose.Types.ObjectId(doctorId) }
      },
      {
        $group: {
          _id: "$place", // Group by location
          appointment: { $sum: 1 }, // Total requests at the location
          confirmed: { $sum: { $cond: [{ $eq: ["$bookingStatus", "booked"] }, 1, 0] } }, // Confirmed requests
          cancels: { $sum: { $cond: [{ $eq: ["$bookingStatus", "canceled"] }, 1, 0] } }, // Canceled requests
          visited: { $sum: { $cond: [{ $eq: ["$bookingStatus", "booked"] }, 1, 0] } }, // Visited requests
          dates: { $push: { date: "$date", status: "$bookingStatus" } } // Collect dates for each booking status
        }
      },
      {
        $project: {
          location: "$_id", // Rename _id to location for clarity
          appointment: 1,
          confirmed: 1,
          cancels: 1,
          visited: 1,
          dates: 1,
          maxVisitedDate: {
            $arrayElemAt: [
              {
                $map: {
                  input: { $filter: { input: "$dates", as: "date", cond: { $eq: ["$$date.status", "booked"] } } },
                  as: "date",
                  in: "$$date.date"
                }
              },
              0
            ]
          }
        }
      }
    ]);


    // console.log("Statistics:", statistics); // For debugging

    res.status(200).json(
      statistics.map(stat => ({
        location: stat._id,
        appointment: stat.appointment,
        requests: stat.cancels + stat.confirmed,
        confirmed: stat.confirmed,
        cancels: stat.cancels,
        visited: stat.visited,
        A_Created_Date: stat.days,
        maxPatientDay: stat.maxVisitedDate,
      }))
    );

  } catch (error) {
    console.error("Error fetching doctor statistics:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
router.get("/doctor/month/statistics", authenticateToken, async (req, res) => {
  const doctorId = req.user._id;

  try {
    const statistics = await BookAppointment.aggregate([
      {
        $match: { doctorId: new mongoose.Types.ObjectId(doctorId) },
      },
      {
        // Convert the 'date' field to an actual Date object
        $addFields: {
          date: { $toDate: "$date" },
        },
      },
      {
        // Extract year, month, and day from the 'date' field
        $addFields: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        },
      },
      {
        // Group by year and month to calculate monthly data
        $group: {
          _id: { year: "$year", month: "$month" },
          totalBooked: { $sum: 1 },
          visits: { $sum: { $cond: [{ $eq: ["$ActiveStatus", true] }, 1, 0] } },
          cancellations: { $sum: { $cond: [{ $eq: ["$ActiveStatus", false] }, 1, 0] } },
          dailyCounts: {
            $push: {
              day: "$day",
              count: { $sum: 1 },
            },
          },
        },
      },
      {
        // Calculate additional fields
        $addFields: {
          maxPatientDay: {
            $max: "$dailyCounts.count"
          },
          maxPatientDate: {
            $first: {
              $filter: {
                input: "$dailyCounts",
                as: "day",
                cond: { $eq: ["$$day.count", "$maxPatientDay"] },
              },
            },
          },
        },
      },
      {
        // Final formatting to match requested structure
        $project: {
          month: {
            $concat: [
              {
                $arrayElemAt: [
                  ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                  { $subtract: ["$_id.month", 1] }
                ]
              },
              " ",
              { $toString: "$_id.year" }
            ]
          },
          totalBooked: 1,
          bookedPerDay: { $divide: ["$totalBooked", 30] }, // Approximation of 30 days per month
          appointments: { $size: "$dailyCounts" },
          visits: 1,
          cancellations: 1,
          maxPatientCount: "$maxPatientDay",
          maxPatientDate: "$maxPatientDate.day",
        },
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 }
      }
    ]);

    res.status(200).json(statistics);
  } catch (error) {
    console.error("Error fetching doctor statistics:", error);
    res.status(500).json({ message: "Server error", error });
  }
});






module.exports = router;
