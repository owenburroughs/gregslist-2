var express=require('express')
var fs=require('fs')
var session=require('express-session')
var update = require('./update')
var bodyparser = require('body-parser')

var app= express();

global.games=[]

//establish session and body parsing middleware
app.use(bodyparser.urlencoded({ extended: true }))
app.use(session({
    secret: 'sam broke his back',
    resave: false,
    saveUninitialized: true,
    maxAge: 3000000
}))


//use update.js for all update calls
app.use('/update', update)

//create public assets directory
app.use(express.static('public'));

//serve index page 
app.use('/', function(req,res){
    fs.readFile('index.html', function(err, data){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data)
        res.end();
    })
})


app.listen('3000')