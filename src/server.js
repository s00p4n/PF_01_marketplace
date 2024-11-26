const url = 'mongodb://localhost:27017/marketplace';
const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        await mongoose.connect(url, {
        });
        console.log('OK');
    } catch (err) {
        console.error('PAS OK:', err);
        process.exit(1);
    }
};
module.exports = connectDB;