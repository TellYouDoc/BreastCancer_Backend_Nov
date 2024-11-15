const mongoose = require('mongoose');

const BreastCancerHistorySchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    immediateFamily: {
        hasBreastCancer: {
            type: String,
            required: true
        },
        numberOfMembers: {
            type: String
        },
        members: [
            {
                relation: {
                    type: String,
                    // required: true
                }, // Relation of the family member (e.g., Mother, Brother)
                ageOfDiagnosis: {
                    type: String,
                    // required: true
                } // Age at which the family member was diagnosed
            }
        ]
    },
    extendedFamily: {
        hasBreastCancer: {
            type: String,
            required: true
        },
        numberOfMembers: {
            type: String
        },
        members: [
            {
                relationSide: {
                    type: String,
                    // required: true
                },
            }
        ]
    },
}, { timestamps: true })

const BreastCancerHistory = mongoose.model('BreastCancerHistory', BreastCancerHistorySchema);



const OtherCancerHistorySchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        // required: true,
    },
    othercancer: {
        hasotherCancer: {
            type: String,
            required: true
        },
        numOfMembers: {
            type: String
        },
        members: [
            {
                relation: {
                    type: String,
                }, // Relation of the family member (e.g., Mother, Brother)
                Cancertype: {
                    type: String,
                } // Cancer Type of the family member 
            }
        ]
    }
}, { timestamps: true })

const OtherCancerHistory = mongoose.model('OtherCancerHistory', OtherCancerHistorySchema);

module.exports = {
    BreastCancerHistory,
    OtherCancerHistory
};