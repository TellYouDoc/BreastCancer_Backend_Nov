const express = require("express");
const router = express.Router();
const DailyEntry = require("../Models/DailyEntrySchema");
const moment = require("moment-timezone");
const { BreastCancerHistory, OtherCancerHistory } = require("../Models/FamilyMedicalHistorySchema"); // Adjusted to match the filename
const OtherSymptoms = require("../Models/OtherSymptomsSchema"); // Import the OtherSymptoms mode
const PersonalMedicalHistory = require("../Models/PersonalMedicalHistory"); // Import your model
const majorChanges = require("../Models/MajorChangesSchema");
const authenticateToken = require('../Middlewares/auth.middleware');
const mongoose = require("mongoose");

//Daily Entry questions
// POST route to save a daily entry
router.post("/daily-entry", authenticateToken, async (req, res) => {
    try {
        const {
            date,
            selectedPeriodDay,
            selectedPain,
            painLevel,
            selectedSide,
            selectedLeftLocations,
            selectedRightLocations,
        } = req.body;
        // Check if the date is provided and in the correct format
        if (!date) {
            return res.status(400).json({ message: "Invalid or missing date format" });
        }

        // Normalize the date to YYYY-MM-DD
        const localDate = moment(date, "MMMM DD, YYYY").tz("Asia/Kolkata").format("YYYY-MM-DD");

        // Normalize selectedPeriodDay to lowercase to ensure consistency
        const normalizedPeriodDay = selectedPeriodDay.toLowerCase();

        if (
            !normalizedPeriodDay ||
            !selectedPain ||
            (selectedPain === "Yes" &&
                (painLevel === undefined || selectedSide === undefined)) ||
            (selectedSide === "Left" && !selectedLeftLocations) ||
            (selectedSide === "Right" && !selectedRightLocations) ||
            (selectedSide === "Both" &&
                (!selectedLeftLocations || !selectedRightLocations))
        ) {
            return res
                .status(400)
                .json({ message: "Invalid data format or missing required fields" });
        }

        // Check if an entry for the same user and date already exists
        const existingEntry = await DailyEntry.findOne({
            patientId: req.user._id,
            date: localDate,
        });

        if (existingEntry) {
            // Update the existing entry if it exists
            existingEntry.selectedPeriodDay = normalizedPeriodDay;
            existingEntry.selectedPain = selectedPain;
            existingEntry.painLevel = painLevel;
            existingEntry.selectedSide = selectedSide;
            existingEntry.selectedLeftLocations = selectedLeftLocations || [];
            existingEntry.selectedRightLocations = selectedRightLocations || [];

            await existingEntry.save();
            return res.status(201).json({ message: "Daily entry updated successfully" });
        } else {
            // Create a new entry if it doesn't exist
            const newEntry = new DailyEntry({
                patientId: req.user._id,
                date: localDate,
                selectedPeriodDay: normalizedPeriodDay, // Store the normalized value
                selectedPain,
                painLevel,
                selectedSide,
                selectedLeftLocations: selectedLeftLocations || [],
                selectedRightLocations: selectedRightLocations || [],
            });
            await newEntry.save();

            return res.status(200).json({ message: "Daily entry saved successfully" });
        }
    } catch (error) {
        console.error("Daily Entry Submission Error:", error);
        res
            .status(500)
            .json({ message: "Failed to save daily entry", error: error.message });
    }
});
// POST route to save feedback for a daily entry
router.post("/daily-entry/feedback", authenticateToken, async (req, res) => {
    const { feedback, date } = req.body;
    const patientId = req.user._id;

    try {
        // Check if the date is provided and in the correct format
        if (!date) {
            return res.status(400).json({ message: "Invalid or missing date format" });
        }

        // Normalize the date to YYYY-MM-DD
        const localDate = moment(date, "MMMM DD, YYYY").tz("Asia/Kolkata").format("YYYY-MM-DD");

        // Find the existing entry based on patientId and date
        const existingEntry = await DailyEntry.findOne({ patientId, date: localDate });

        if (!existingEntry) {
            return res.status(404).json({ message: "No entry found for the specified date" });
        }

        // Update the feedback field
        existingEntry.feedback = feedback;
        await existingEntry.save();

        res.status(200).json({ message: "Feedback updated successfully" });
    } catch (error) {
        console.error("Daily Entry feedback Submission Error:", error);
        res
            .status(500)
            .json({ message: "Failed to save daily entry feedback", error: error.message });
    }
});
// GET route to retrieve daily entries
router.get("/get-daily-entry", authenticateToken, async (req, res) => {
    const patientId = req.query.patientId || req.user._id;
    try {
        const { duration, aggregate } = req.query;
        let startDate;

        // Determine the start date based on the duration
        switch (duration) {
            case "10days":
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 10);
                break;
            case "1month":
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case "6months":
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 6);
                break;
            case "1year":
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate = null;
        }

        // Build the filter with patientId and optional date range
        const filter = { patientId };
        if (startDate) {
            filter.date = { $gte: startDate };
        }

        if (aggregate === "painLevels") {
            // Aggregating data for the pie chart
            const aggregatedData = await DailyEntry.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: "$painLevel", // Group by pain level
                        count: { $sum: 1 }, // Count the number of occurrences
                    },
                },
                {
                    $project: {
                        _id: 0,
                        painLevel: "$_id",
                        count: 1,
                    },
                },
            ]).sort({ painLevel: 1 });

            return res.json(aggregatedData);
        } else {
            // Default data retrieval for line graph and heatmap
            const entries = await DailyEntry.find(filter).sort({ date: 1 });

            // Normalize selectedPeriodDay to lowercase before sending the response
            const normalizedEntries = entries.map((entry) => ({
                ...entry.toObject(),
                selectedPeriodDay: entry.selectedPeriodDay.toLowerCase(),
            }));

            return res.json(normalizedEntries);
        }
    } catch (error) {
        console.error("Error retrieving daily entries:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




//Family Medical History Questions 
// Create or update a family medical history record
router.post("/familyMedicalHistory/breastCancer", authenticateToken, async (req, res) => {
    try {
        const { immediateFamily, extendedFamily } = req.body;

        // Validate relationSide for extendedFamily
        const validateRelations = (relations) => {
            return relations.every((relation) => {
                const { relationSide } = relation;
                return (
                    relationSide === "Maternal" ||
                    relationSide === "Paternal" ||
                    relationSide === null ||
                    relationSide === ""
                );
            });
        };

        if (extendedFamily?.members && !validateRelations(extendedFamily.members)) {
            return res.status(400).send({ error: "Invalid relationSide value." });
        }

        // Include patientId in the request body to be saved/updated
        const body = { immediateFamily, extendedFamily, patientId: req.user._id };

        // Find existing history by patientId
        const existingHistory = await BreastCancerHistory.findOne({ patientId: req.user._id });

        if (existingHistory) {
            // Update existing record
            Object.assign(existingHistory, body);
            await existingHistory.save();
            return res.status(200).send(existingHistory);
        }

        // Create a new history record if none exists
        const history = new BreastCancerHistory(body);
        await history.save();
        res.status(201).send(history);

    } catch (error) {
        console.error("Error saving record:", error);
        res.status(400).send({ error: error.message, details: error });
    }
});
// Fetch family medical history record
router.get("/familyMedicalHistory/breastCancer", authenticateToken, async (req, res) => {
    try {
        const history = await BreastCancerHistory.findOne({ patientId: req.user._id });

        res.status(200).send(history);
    } catch (error) {
        console.error("Error fetching record:", error);
        res.status(500).send({ error: error.message });
    }
});
// Create or update a family medical history record
router.post("/familyMedicalHistory/othersCancer", authenticateToken, async (req, res) => {
    try {
        const othercancer = req.body.othercancer;
        const patientId = req.user._id;

        // Check if there’s an existing record for this patient
        let history = await OtherCancerHistory.findOne({ patientId });

        if (history) {
            // Update existing record
            history.othercancer = othercancer;
            await history.save();
            return res.status(200).send(history);
        }

        // Create a new history record if none exists
        history = new OtherCancerHistory({
            patientId,
            othercancer
        });
        await history.save();
        res.status(201).send(history);

    } catch (error) {
        console.error("Error saving record:", error);
        res.status(400).send({ error: error.message, details: error });
    }
});
// Fetch family medical history record
router.get("/familyMedicalHistory/othersCancer", authenticateToken, async (req, res) => {
    try {
        const history = await OtherCancerHistory.findOne({ patientId: req.user._id });

        res.status(200).send(history);
    } catch (error) {
        console.error("Error fetching record:", error);
        res.status(500).send({ error: error.message });
    }
});




// Create or update a personal medical history record
router.post("/personalMedicalHistory", authenticateToken, async (req, res) => {
    try {
        const patientId = req.user._id; // Assuming patientId is part of the authenticated user
        const existingHistory = await PersonalMedicalHistory.findOne({ patientId });
        // console.log("Existing History: ", existingHistory);

        // Map the incoming body data to the required schema structure
        const body = {
            patientId,
            history: [
                {
                    title: "Personal Medical History",
                    questions: Object.entries(req.body).map(([key, value]) => ({
                        question: key,
                        answer: value
                    }))
                }
            ]
        };

        if (existingHistory) {
            // If a record exists, update it
            existingHistory.history = body.history; // Replace the history with the new data
            await existingHistory.save();
            return res.status(200).send(existingHistory); // Respond with the updated record
        }

        // If no existing record, create a new one
        const history = new PersonalMedicalHistory(body);
        await history.save();
        res.status(201).send(history); // Respond with the created record
    } catch (error) {
        console.error("Error saving record:", error);
        res.status(400).send({ error: error.message, details: error });
    }
});
//personalMedicalHistory feedback route
router.post("/personalMedicalHistory/feedback", authenticateToken, async (req, res) => {
    try {
        // Extract data from the request body and normalize the date
        let { feedback } = req.body;
        const patientId = req.user._id;
        if (!feedback) {
            return res.status(400).json({ message: "feedback is required" });
        }
        // Check if a record exists with the given date and patientId
        let existingRecord = await PersonalMedicalHistory.findOne({ patientId });
        if (!existingRecord) {
            await existingRecord.save();
            return res.status(404).json({ message: "major symptoms not exist this date." });
        }
        existingRecord.feedback = feedback;
        await existingRecord.save();

        return res.status(200).json({ message: "major symptoms feedback saved successfully." });

    } catch (error) {
        console.error("Error saving long-term symptoms data:", error);
        res.status(500).json({ error: "An error occurred while saving data." });
    }
});
// Get a personal medical history record by patient ID
// Fetch Medical History
router.get("/personalMedicalHistory", authenticateToken, async (req, res) => {
    try {
        const patientId = req.user._id;
        const history = await PersonalMedicalHistory.findOne({ patientId }); // Adjust this query if needed
        if (!history) {
            return res.status(404).send({ message: "Record not found." });
        }
        res.status(200).send(history);

        // Completed
        // Date being fetched correctly
    } catch (error) {
        console.error("Error fetching record:", error);
        res.status(500).send({ error: error.message });
    }
});
// Fetch Medical History
router.get("/personalMedicalHistory/doctor", authenticateToken, async (req, res) => {
    try {
        const patientId = req.query.patientId;
        const history = await PersonalMedicalHistory.findOne({ patientId }); // Adjust this query if needed
        if (!history) {
            return res.status(404).send({ message: "Record not found." });
        }
        res.status(200).send(history);

        // Completed
        // Date being fetched correctly
    } catch (error) {
        console.error("Error fetching record:", error);
        res.status(500).send({ error: error.message });
    }
});




// Major changes route
router.post("/majorChanges", authenticateToken, async (req, res) => {
    try {
        // Extract data from the request body and normalize the date
        let {
            date,
            haveLumps,
            lumpType,
            changeInBreastSymmetry,
            haveBreastSymmetry,
            breastSizeChanged,
            breastSizeChangeSide,
            selectedLeftSize,
            selectedRightSize,
            haveSwelling,
            swellingSide,
            haveNippleDischarge,
            haveUnusualNippleDischargeColor,
            dischargeSmell,
        } = req.body;
        const patientId = req.user._id;

        // Normalize date format to 'YYYY-MM-DD' in Asia/Kolkata timezone
        date = moment(date, "MMMM DD, YYYY").tz("Asia/Kolkata").format("YYYY-MM-DD");
        console.log("Normalized Date:", date);

        // Check if a record exists with the given date and patientId
        let existingSymptoms = await majorChanges.findOne({ patientId, date });

        if (existingSymptoms) {
            // Update the existing record
            existingSymptoms.haveLumps = haveLumps;
            existingSymptoms.lumpType = lumpType || [];
            existingSymptoms.changeInBreastSymmetry = changeInBreastSymmetry;
            existingSymptoms.haveBreastSymmetry = haveBreastSymmetry || "";
            existingSymptoms.breastSizeChanged = breastSizeChanged;
            existingSymptoms.breastSizeChangeSide = breastSizeChangeSide || "";
            existingSymptoms.selectedLeftSize = selectedLeftSize || "";
            existingSymptoms.selectedRightSize = selectedRightSize || "";
            existingSymptoms.haveSwelling = haveSwelling;
            existingSymptoms.swellingSide = swellingSide || "";
            existingSymptoms.haveNippleDischarge = haveNippleDischarge || "";
            existingSymptoms.haveUnusualNippleDischargeColor = haveUnusualNippleDischargeColor || "";
            existingSymptoms.dischargeSmell = dischargeSmell || "";

            // Save updated record
            await existingSymptoms.save();
            return res.status(200).json({ message: "Long-term symptoms updated successfully." });
        } else {
            // Create a new record if no existing record is found
            const newSymptoms = new majorChanges({
                patientId,
                date,
                haveLumps,
                lumpType: lumpType || [],
                changeInBreastSymmetry,
                haveBreastSymmetry: haveBreastSymmetry || "",
                breastSizeChanged,
                breastSizeChangeSide: breastSizeChangeSide || "",
                selectedLeftSize: selectedLeftSize || "",
                selectedRightSize: selectedRightSize || "",
                haveSwelling,
                swellingSide: swellingSide || "",
                haveNippleDischarge: haveNippleDischarge || "",
                haveUnusualNippleDischargeColor: haveUnusualNippleDischargeColor || "",
                dischargeSmell: dischargeSmell || "",
            });
            await newSymptoms.save();

            return res.status(200).json({ message: "Long-term symptoms saved successfully." });
        }
    } catch (error) {
        console.error("Error saving long-term symptoms data:", error);
        res.status(500).json({ error: "An error occurred while saving data." });
    }
});
// Major changes get date route
router.get("/majorChanges", authenticateToken, async (req, res) => {
    try {
        const patientId = req.query.patientId || req.user._id;
        // console.log(patientId)
        // Retrieve only the `date` field for each document that matches the patientId
        let dates = await majorChanges.find({ patientId }, { date: 1, _id: 0 });
        // console.log(dates)
        return res.status(200).json(dates);
    } catch (error) {
        console.error("Error retrieving dates:", error);
        res.status(500).json({ error: "An error occurred while retrieving dates." });
    }
});
// Major changes route
router.get("/majorChanges/date", authenticateToken, async (req, res) => {
    try {
        // Extract date from the request query
        const patientId = req.query.patientId || req.user._id;
        let { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: "Date is required" });
        }

        // Normalize date to 'YYYY-MM-DD' format in Asia/Kolkata timezone
        date = moment(new Date(date)).tz("Asia/Kolkata").format("YYYY-MM-DD");
        // console.log("Normalized Date:", date);

        // Adjust filter to match only the date part without time
        let existingSymptoms = await majorChanges.findOne({
            patientId,
            date: { $eq: new Date(date) }
        });
        if (!existingSymptoms) {
            return res.status(404).json({ message: "No records found for the specified date" });
        }

        return res.status(200).json(existingSymptoms);
    } catch (error) {
        console.error("Error retrieving long-term symptoms data:", error);
        res.status(500).json({ error: "An error occurred while retrieving data." });
    }
});
// Major changes all data route
router.get("/majorChanges/summary", authenticateToken, async (req, res) => {
    try {
        const patientId = req.query.patientId || req.user._id;
        const result = await majorChanges.aggregate([
            { $match: { patientId: new mongoose.Types.ObjectId(patientId) } },
            {
                $facet: {
                    haveLumps: [
                        { $match: { haveLumps: "Yes" } },
                        { $sort: { date: -1 } },
                        { $limit: 1 }
                    ],
                    haveBreastSymmetry: [
                        { $match: { haveBreastSymmetry: "Yes" } },
                        { $sort: { date: -1 } },
                        { $limit: 1 }
                    ],
                    breastSizeChanged: [
                        { $match: { breastSizeChanged: "Yes" } },
                        { $sort: { date: -1 } },
                        { $limit: 1 }
                    ],
                    haveSwelling: [
                        { $match: { haveSwelling: "Yes" } },
                        { $sort: { date: -1 } },
                        { $limit: 1 }
                    ],
                    haveNippleDischarge: [
                        { $match: { haveNippleDischarge: "Unusual" } },
                        { $sort: { date: -1 } },
                        { $limit: 1 }
                    ]
                }
            }
        ]);
        // Extracting and organizing the data from the aggregated result
        const summary = {
            haveLumps: result[0].haveLumps[0] || null,
            haveBreastSymmetry: result[0].haveBreastSymmetry[0] || null,
            breastSizeChanged: result[0].breastSizeChanged[0] || null,
            haveSwelling: result[0].haveSwelling[0] || null,
            haveNippleDischarge: result[0].haveNippleDischarge[0] || null
        };

        return res.status(200).json(summary);

    } catch (error) {
        console.error("Error retrieving major changes data:", error);
        res.status(500).json({ error: "An error occurred while retrieving data." });
    }
});

//major changes feedback route
router.post("/majorChanges/feedback", authenticateToken, async (req, res) => {
    try {
        // Extract data from the request body and normalize the date
        let {
            date,
            feedback
        } = req.body;
        const patientId = req.user._id;

        // Normalize date format to 'YYYY-MM-DD' in Asia/Kolkata timezone
        date = moment(date, "MMMM DD, YYYY").tz("Asia/Kolkata").format("YYYY-MM-DD");
        console.log("Normalized Date:", date);

        // Check if a record exists with the given date and patientId
        let existingSymptoms = await majorChanges.findOne({ patientId, date });

        if (!existingSymptoms) {
            await existingSymptoms.save();
            return res.status(404).json({ message: "major symptoms not exist this date." });
        }
        existingSymptoms.feedback = feedback;
        await existingSymptoms.save();

        return res.status(200).json({ message: "major symptoms feedback saved successfully." });

    } catch (error) {
        console.error("Error saving long-term symptoms data:", error);
        res.status(500).json({ error: "An error occurred while saving data." });
    }
});



//Other symptoms Questions 
// POST request to save other symptoms data
router.post("/otherSymptoms", authenticateToken, async (req, res) => {
    try {
        let {
            date,
            haveAssociatedSymptoms,
            haveFatigue,
            haveIrritation,
            haveNippleInversion,
            haveWhichNippleInversion,
            haveWhichNippleInversionOnLeft,
            haveWhichNippleInversionOnRight,
            haveRashes,
        } = req.body;

        // // Log the incoming date to check format
        // console.log("Original Date:", date);

        // Normalize the date to 'YYYY-MM-DD' format in Asia/Kolkata timezone
        date = moment(date, "MMMM DD, YYYY").tz("Asia/Kolkata").format("YYYY-MM-DD");
        // console.log("Normalized Date:", date);

        // Find or create the symptoms data entry
        let otherSymptomsData = await OtherSymptoms.findOne({ date, patientId: req.user._id });
        if (otherSymptomsData) {
            // Update existing entry
            otherSymptomsData.date = date;
            otherSymptomsData.haveAssociatedSymptoms = haveAssociatedSymptoms;
            otherSymptomsData.haveFatigue = haveFatigue;
            otherSymptomsData.haveIrritation = haveIrritation;
            otherSymptomsData.haveNippleInversion = haveNippleInversion;
            otherSymptomsData.haveWhichNippleInversion = haveWhichNippleInversion;
            otherSymptomsData.haveWhichNippleInversionOnLeft = haveWhichNippleInversionOnLeft;
            otherSymptomsData.haveWhichNippleInversionOnRight = haveWhichNippleInversionOnRight;
            otherSymptomsData.haveRashes = haveRashes;

            const updatedData = await otherSymptomsData.save();
            return res.status(201).json({ message: "Symptoms data updated successfully!", data: updatedData });
        } else {
            // Create new entry if none exists
            otherSymptomsData = new OtherSymptoms({
                patientId: req.user._id,
                date,
                haveAssociatedSymptoms,
                haveFatigue,
                haveIrritation,
                haveNippleInversion,
                haveWhichNippleInversion,
                haveWhichNippleInversionOnLeft,
                haveWhichNippleInversionOnRight,
                haveRashes,
            });
            const savedData = await otherSymptomsData.save();
            return res.status(201).json({ message: "Symptoms data saved successfully!", data: savedData });
        }
    } catch (error) {
        console.error("Error saving symptoms data:", error);
        res.status(500).json({
            message: "Failed to save symptoms data",
            error: error.message,
        });
    }
});
// Other symptoms get date route
router.get("/otherSymptoms", authenticateToken, async (req, res) => {
    try {
        const patientId = req.query.patientId || req.user._id;
        // Retrieve only the `date` field for each document that matches the patientId
        let dates = await OtherSymptoms.find({ patientId }, { date: 1, _id: 0 });
        return res.status(200).json(dates);
    } catch (error) {
        console.error("Error retrieving dates:", error);
        res.status(500).json({ error: "An error occurred while retrieving dates." });
    }
});
// Other symptoms  get route
router.get("/otherSymptoms/date", authenticateToken, async (req, res) => {
    try {
        // Extract date from the request query              
        let { date } = req.query;
        const patientId = req.query.patientId || req.user._id;
        if (!date) {
            return res.status(400).json({ error: "Date is required" });
        }

        // Normalize date to 'YYYY-MM-DD' format in Asia/Kolkata timezone
        date = moment(new Date(date)).tz("Asia/Kolkata").format("YYYY-MM-DD");
        // console.log("Normalized Date:", date);

        // Adjust filter to match only the date part without time
        let existingSymptoms = await OtherSymptoms.findOne({
            patientId,
            date: { $eq: new Date(date) }
        });

        if (!existingSymptoms) {
            return res.status(404).json({ message: "No records found for the specified date" });
        }

        return res.status(200).json(existingSymptoms);
    } catch (error) {
        console.error("Error retrieving long-term symptoms data:", error);
        res.status(500).json({ error: "An error occurred while retrieving data." });
    }
});
// POST request to save other symptoms feedback data
router.post("/otherSymptoms/feedback", authenticateToken, async (req, res) => {
    try {
        let { date, feedback } = req.body;

        // Log the incoming date and feedback for debugging
        // console.log("Received Date:", date, "Feedback:", feedback);

        // Normalize the date to 'YYYY-MM-DD' in the Asia/Kolkata timezone
        date = moment(date, "MMMM DD, YYYY").tz("Asia/Kolkata").format("YYYY-MM-DD");
        // console.log("Normalized Date:", date);

        // Check if a record already exists for the patientId and the specified date
        let otherSymptomsData = await OtherSymptoms.findOne({ patientId: req.user._id, date });

        if (!otherSymptomsData) {
            return res.status(404).json({ message: "Symptoms data not found for the specified date" });
        }

        // Update the feedback field
        otherSymptomsData.feedback = feedback;
        await otherSymptomsData.save();

        return res.status(201).json({ message: "Feedback submitted successfully!" });
    } catch (error) {
        console.error("Error saving feedback data:", error);
        res.status(500).json({
            message: "Failed to save feedback data",
            error: error.message,
        });
    }
});


module.exports = router; // Ensure that you're exporting the router