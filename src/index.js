var express = require('express');
const path = require('path');
const bcrypt = require("bcrypt")
const {collection,itemSchema,CreditCard} = require("./server")
const session = require('express-session');

var app = express ();
//https
var consolidate = require('consolidate');
var bodyParser = require("body-parser");
var https = require('https');
var fs = require('fs');
var http = require('http');
//https

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.set('view engine', 'ejs')
app.use(express.static("static"));
app.use(session({
    secret: 'propre123',
    resave: false,
    saveUninitialized: true
}));

https.createServer({
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
    passphrase: 'ingi'
}, app).listen(5001, () => {
    console.log('HTTPS');
});

http.createServer((req, res) => {
    res.writeHead(301, { "Location": `https://localhost:5001${req.url}` });
    res.end();
}).listen(5002, () => {
    console.log('HTTP server running on port 5002 (redirecting to HTTPS)');
});

app.get("/login", (req, res) =>{
    res.render("login");
})

app.get("/signup", (req, res) =>{
    res.render("signup");
})
app.get("/", async (req, res) => {
    try {
        const user = await collection.findOne({ gmail: req.session.user });
        if (!user) {
            return res.redirect('/login');
        }
        const sort = req.query.sort;

        let sortOptions = {};
        if (sort === 'asc') {
            sortOptions.Price = 1;
        } else if (sort === 'desc') {
            sortOptions.Price = -1;
        }
        const items = await itemSchema.find().sort(sortOptions);
        res.render("home", {
            items,
            balance: user.balance
        });
    } catch (error) {
        res.status(500).send("Error");
    }
});
app.get("/item/:id", async (req, res) => {
    try {
        const itemId = req.params.id;
        const item = await itemSchema.findById(itemId);
        if (!item) {
            return res.status(404).send("Item not found.");
        }
        res.render("item", { item });
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while fetching the item.");
    }
});

app.get('/new', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login');
    }
    const userEmail = req.session.user;
    res.render('new', { userEmail });
});

app.get('/profil', isAuthenticated, async (req, res) => {
    try {
        const userEmail = req.session.user;
        const user = await collection.findOne({ gmail: userEmail }).populate({
            path: 'purchases.itemId',
            model: 'item',
            select: 'Name Price'
        });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.render('profil', { user, purchases: user.purchases });
    } catch (err) {
        console.error("Error fetching user profile:", err);
        res.status(500).send("Error fetching user profile");
    }
});

app.post("/signup", async(req,res) => {
    const data ={
        gmail: req.body.gmail,
        password: req.body.password
    }
    const exitinguser = await collection.findOne({gmail: data.gmail});

    if (exitinguser){
        res.send("Gmail already exists, please try with an other Gmail")
    }else{
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds)

        data.password = hashedPassword;

        const userdata = await collection.insertMany(data);
        console.log(userdata);
        return res.redirect('/');
    }
});
app.post("/login", async(req, res)=>{
    try{
        const checked = await collection.findOne({gmail: req.body.gmail});
        if(!checked){
            res.send("Gmail not found");
        }
        const isPasswordMatch = await bcrypt.compare(req.body.password, checked.password)
        if(isPasswordMatch){
            req.session.loggedIn = true;
            req.session.user = checked.gmail;
            return res.redirect("/");
        }else{
            res.send("wrong password, please try again!")
        }
    }catch{
        res.status(500).send("An error occurred, please try again later.");

    }
})

app.get('/sessionlogged', (req, res) => {
    if (req.session.loggedIn) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/update-balance', async (req, res) => {
    try {
        const { prize } = req.body;
        const userEmail = req.session.user;
        const user = await collection.findOne({ gmail: userEmail });
        if (!userEmail || !user) {
            return res.status(401).send('Unauthorized: Please log in.');
        }

        user.balance += prize;
        await user.save();

        res.json({ newBalance: user.balance });
    } catch (error) {
        console.error('Error updating balance:', error);
        res.status(500).send('Failed to update balance.');
    }
});


function isAuthenticated(req, res, next) {
    if (req.session.loggedIn) {
        return next();
    }
    res.redirect('/login');
}
app.post("/submit-item", (req, res) => {
    const { description, price, stock, image, sellerEmail, name } = req.body;

    if (!description || !price || !stock || !image || !sellerEmail || !name) {
        return res.status(400).send("All fields are required.");
    }

    try {
        const newItem = new itemSchema({
            Description: description,
            Price: price,
            Stock: stock,
            Image: image,
            Name: name,
            SellerEmail: sellerEmail,
        });

        newItem.save()
            .then(() => {
            return res.redirect("/");
        })
            .catch((error) => {
            console.error(error);
            res.status(500).send("An error occurred while saving the item.");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred.");
    }
});
app.post('/top-up', async (req, res) => {
    const { cardNumber, cvv, amount } = req.body;

    try {
        const creditCard = await CreditCard.findOne({ cardNumber, cvv });

        if (!creditCard) {
            return res.status(400).send("Invalid card number or CVV.");
        }
        if (creditCard.cardBalance < amount) {
            return res.status(400).send("Insufficient balance in the credit card.");
        }
        const userEmail = req.session.user;
        const user = await collection.findOne({ gmail: userEmail });
        if (!user) {
            return res.status(404).send("User not found.");
        }

        user.balance += parseFloat(amount);
        user.balance += prizevalue;
        await user.save();
        creditCard.cardBalance -= parseFloat(amount);
        await creditCard.save();
        return res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while processing the top-up.");
    }
});
app.post('/purchase/:itemId', async (req, res) => {
    const userEmail = req.session.user;
    const { quantity } = req.body;
    const itemId = req.params.itemId;

    try {
        const item = await itemSchema.findById(itemId);
        if (!item) {
            return res.status(404).send('Item not found.');
        }
        const user = await collection.findOne({ gmail: userEmail });
        if (!user) {
            return res.status(404).send('User not found.');
        }
        if (item.Stock < quantity) {
            return res.status(400).send('Not enough stock available.');
        }
        const totalPrice = item.Price * quantity;
        if (user.balance < totalPrice) {
            return res.status(400).send('Insufficient balance.');
        }
        user.balance -= totalPrice;
        item.Stock -= quantity;
        await user.save();
        await item.save();
        user.purchases.push({ itemId: item._id, quantity });
        await user.save();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during the purchase.');
    }
});
