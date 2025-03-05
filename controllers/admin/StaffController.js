const Joi = require("joi");
const Admin = require("../../models/admin.js");
const { buildResult } = require("../../Utils/Response.js");
const { pagination } = require("../../Utils/Pagination.js");

const bcrypt = require("bcrypt");

class StaffController {
  constructor() {
    this.schema = Joi.object().keys({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string()
        .pattern(/^[0-9]+$/)
        .required(),
      modules: Joi.array().items(Joi.string()).min(1).required(),
      password: Joi.string().min(6).optional(),
    });
  }

  create = async (req, res) => {
    const imageFile = req?.file?.path || null;

    try {
      const { error, value } = this.schema.validate(req.body);

      const existingUser = await Admin.findOne({ email: value.email });
      if (existingUser) {
        return buildResult(res, 201, {}, {}, null, "Email already in use");
      }

      if (error) {
        return buildResult(res, 201, {}, {}, null, error);
      }

      let insertData = {
        ...value,
        createdBy: req.user.id,
      };
      if (imageFile) {
        insertData.profilePhoto = imageFile;
      }

      const resource = await Admin.create(insertData);
      return buildResult(
        res,
        200,
        resource,
        {},
        null,
        "Staff User created successfully"
      );
    } catch (error) {
      console.error("Error fetching resources:", error);
      return buildResult(res, 400, {}, {}, error);
    }
  };
  getAll = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
      let resources = await Admin.find({
        isDeleted: false,
      })
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: "desc" });

      let totalCount = await Admin.countDocuments({
        isDeleted: false,
      });

      return buildResult(
        res,
        200,
        resources,
        pagination(totalCount, page, limit)
      );
    } catch (error) {
      console.error("Error fetching resources:", error);
      return buildResult(res, 400, {}, {}, error);
    }
  };

  getById = async (req, res) => {
    const id = req.params.id;
    try {
      const resource = await Admin.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!resource) {
        return buildResult(res, 404, {}, {}, "Staff User not found");
      }

      return buildResult(res, 200, resource);
    } catch (error) {
      console.error("Error fetching staff user by ID:", error);
      return buildResult(res, 400, {}, {}, error);
    }
  };

  update = async (req, res) => {
    try {
      const { error, value } = this.schema.validate(req.body);
      if (error) {
        return buildResult(res, 400, {}, {}, error);
      }

      // Check if the email exists and doesn't belong to the current user
      const existingUser = await Admin.findOne({ email: value.email });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        return buildResult(
          res,
          201,
          {},
          {},
          null,
          "Email already in use by another user"
        );
      }

      let updateData = {
        ...value,
        updatedBy: req.user.id,
      };

      if (req.file && req.file.path) {
        updateData.profilePhoto = req.file.path;
      }
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(req.body.password, salt);
      }

      const resource = await Admin.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!resource) {
        return buildResult(
          res,
          404,
          {},
          {},
          "Staff User not found or already deleted"
        );
      }

      return buildResult(
        res,
        200,
        resource,
        {},
        null,
        "Staff User updated successfully"
      );
    } catch (error) {
      console.error("Error updating staff user:", error);
      return buildResult(res, 400, {}, {}, error);
    }
  };

  delete = async (req, res) => {
    try {
      const resource = await Admin.updateOne(
        {
          _id: req.params.id,
          isDeleted: false,
        },
        {
          $set: {
            isDeleted: true,
            updatedBy: req.user.id,
          },
        }
      );

      if (resource.nModified === 0) {
        return buildResult(
          res,
          404,
          {},
          {},
          "Staff User not found or already deleted"
        );
      }

      return buildResult(
        res,
        200,
        resource,
        {},
        null,
        "Staff User deleted successfully"
      );
    } catch (error) {
      console.error("Error deleting staff user:", error);
      return buildResult(res, 400, {}, {}, error);
    }
  };

  changeStatus = async (req, res) => {
    let status = req.query.status || "active";
    try {
      let resource = await Admin.updateOne(
        { _id: req.params.id, isDeleted: false },
        { $set: { status: status, updatedBy: req.user.id } }
      );

      if (resource.nModified === 0) {
        return buildResult(
          res,
          404,
          {},
          {},
          null,
          "Staff User not found or no changes made"
        );
      }

      return buildResult(
        res,
        200,
        resource,
        {},
        null,
        "Staff User status updated successfully"
      );
    } catch (error) {
      console.error("Error updating staff user status:", error);
      return buildResult(res, 400, {}, {}, error);
    }
  };
}

module.exports = new StaffController();
