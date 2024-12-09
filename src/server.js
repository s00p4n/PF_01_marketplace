const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb://localhost:27017/Login")

connect.then(() => {
    console.log("Database connected Successfully");

    // Add the credit cards data directly
    CreditCard.insertMany([
        { cardNumber: '1234567812345678', cvv: '123', cardBalance: 500.00 },
        { cardNumber: '9876543298765432', cvv: '456', cardBalance: 1000.00 },
        { cardNumber: '1111222233334444', cvv: '789', cardBalance: 250.00 }
    ])
        .then(() => {
            console.log("Credit cards added successfully");
        })
        .catch((err) => {
            console.error("Error inserting credit card data:", err);
        });
})
    .catch(() => {
        console.log("DB can't be connected");
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
    },
    purchases: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        quantity: { type: Number }
    }],
    balance: {
        type: Number,
        default: 0
    }
});
const creditCardSchema = new mongoose.Schema({
    cardNumber: {
        type: String,
        required: true,
        minlength: 16,
        maxlength: 16,
    },
    cvv: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 3,
    },
    cardBalance: {
        type: Number,
        required: true,
    }
});
const ItemSchema = new mongoose.Schema({
    Price: { type: Number, required: true },
    Description: { type: String, required: true },
    SellerEmail: { type: String, required: true },
    Name: { type: String, required: true },
    Stock: { type: Number, required: true },
    Image: { type: String, required: true }
}, {
    collection: 'item'
});
const CreditCard = mongoose.model('CreditCard', creditCardSchema);
const collection = mongoose.model("users", LogInSchema);
const itemSchema = mongoose.model("item", ItemSchema);
module.exports = {collection,itemSchema,CreditCard};
