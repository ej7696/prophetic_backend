const mongoose = require("mongoose");


const buildResult = (res, status, result, pagination = {}, error, message) => {
    if (error) {
      
        return res.status(status).json({
            statusCode: status,
            message: error.message,
            data: {},
        });
    } else {
       
        return res.status(status).json({
            statusCode: status,
            message: message,
            data: result,
            pagination: pagination,
        });
    }
};


const ObjectId = (id) => {
    try {
        return new mongoose.Types.ObjectId(id);
    } catch (error) {
        return null;
    }
};


module.exports = {
    buildResult,
    ObjectId,
};
