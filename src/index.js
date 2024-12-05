var express = require('express'); 
const path = require('path');
const bcrypt = require("bcrypt")
const collection = require("./server")


var app = express (); 
 
app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.set('view engine', 'ejs')
app.use(express.static("static"));

app.get("/login", (req, res) =>{
    res.render("login");
})

app.get("/signup", (req, res) =>{
    res.render("signup");
})


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
                res.render("home")
            }else{
                res.send("wrong password, please try again!")
            }
        }catch{
            res.status(500).send("An error occurred, please try again later.");

        }
})

const port = 5000
app.listen(port, async() =>{
    console.log(`Server runnung on Port, ${port}`)
})
