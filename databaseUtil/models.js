require("dotenv").config();
const schema = require("./schemas");
const mongoose = require("mongoose");

const url = process.env.MONGO_DB_SERVER_WITH_DATABASE;

const dbConnect = async () => {
    try {
        await mongoose.connect(url);
    } catch (error) {
        throw new Error(error);
    }
};

async function model(collectionName) {
    if (!mongoose.models[collectionName] && mongoose.connection.readyState == 1) {
        await mongoose.model(collectionName, schema[collectionName]);
    }
    return mongoose.models[collectionName];
}

module.exports = { dbConnect, model }
