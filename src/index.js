var express = require('express');
const cookieParser = require('cookie-parser');                                                          // cookies
const path = require('path');
const bcrypt = require("bcrypt")
const {collection,itemSchema} = require("./server")
const session = require('express-session');

var app = express ();

app.use(cookieParser());                                                                                // cookies
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.set('view engine', 'ejs')
app.use(express.static("static"));
app.use(session({
    secret: 'propre123',
    resave: false,
    saveUninitialized: true
}));

app.get("/login", (req, res) =>{
    res.render("login");
})

app.get("/signup", (req, res) =>{
    res.render("signup");
})

app.get("/", async (req, res) => {
    try {
        const items = await itemSchema.find();
        let balance = 0; // kateryna: If logged in, retrieve the user's balance from the database; otherwise, set balance to 0
        if (req.session.loggedIn) {
            const user = await collection.findOne({ gmail: req.session.user });
            balance = user?.balance || 0; // kateryna: If user balance exists, use it; otherwise, default to 0
        }
        res.render("home", { items , balance });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching items");
    }
});

app.get('/new', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login');
    }

    const userEmail = req.session.user;
    res.render('new', { userEmail });
});
app.get('/profil', isAuthenticated, (req, res) => {
    res.render('profil');
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

        res.render("home", { items });;
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
            res.cookie('user', checked.gmail, { maxAge: 900000, httpOnly: true });                      // cookies
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
function isAuthenticated(req, res, next) {
    if (req.session.loggedIn) {
        return next();
    }
    res.redirect('/login');
}
app.post("/submit-item", (req, res) => {
    const { description, price, stock, image, sellerEmail } = req.body;

    if (!description || !price || !stock || !image || !sellerEmail) {
        return res.status(400).send("All fields are required.");
    }

    try {
        const newItem = new itemSchema({
            Description: description,
            Price: price,
            Stock: stock,
            Image: image,
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

const port = 5000
app.listen(port, async() =>{
    console.log(`Server runnung on Port, ${port}`)
})
