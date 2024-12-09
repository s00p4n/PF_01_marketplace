var express = require('express'); 
const path = require('path');
const bcrypt = require("bcrypt")
const {collection,itemSchema} = require("./server")
const session = require('express-session');


var app = express (); 
 
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
        res.render("home", { items });
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

    res.render("home");
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
