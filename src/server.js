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
const ItemSchema = new mongoose.Schema({
    Price: { type: Number, required: true },
    Description: { type: String, required: true },
    SellerEmail: { type: String, required: true },
    Stock: { type: Number, required: true },
    Image: { type: String, required: true }
}, {
    collection: 'item'
});
const collection = new mongoose.model("users", LogInSchema);
const itemSchema = new mongoose.model("item", ItemSchema);
module.exports = {collection,itemSchema};
