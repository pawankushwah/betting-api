const mongoose = require("mongoose");

const users = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  type: {
    type: String
  }
});

module.exports = { users };