// validations/userValidation.js
const Joi = require('joi');

// User Profile Update Validation Schema
const updateUserProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  dob: Joi.string().optional(),
  phoneNumber: Joi.string().optional(),
  // Add more fields if needed
});

module.exports = {
  updateUserProfileSchema,
};
