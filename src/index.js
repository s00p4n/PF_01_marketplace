var express = require('express');
var app = express ();
const path = require('path');
const connectDB = require('./server')
connectDB();
app.listen(8080);
console.log('http://localhost:8080/');
app.set("view engine", "ejs");
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', async (req, res) => {
    res.render('principale');
});