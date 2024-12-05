const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb://localhost:27017/Login")

connect.then(()=> {
    console.log("Database connected Successfully");
})
.catch(()=>{
    console.log("DB can't be connected")
});

const LogInSchema = new mongoose.Schema({
    gmail: {
        type: String,
        required : true,
        unique : true,
        validate: {
            validator: function (v) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        required : true
    }
});

const collection = new mongoose.model("users", LogInSchema);

module.exports = collection;