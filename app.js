//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;
// const encrypt = require('mongoose-encryption');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const port = process.env.port || 8000;


const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "Our little secret", // enter this in .env file
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home")
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets",(req,res)=>{
    User.find({"secret":{$ne:null}}, (err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                res.render("secrets", {usersWithSecrets: foundUser});
            }
        }
    })
});

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

// app.post("/submit",(req,res)=>{
//     const submittedSecret = req.body.secret;
//     console.log(req.user.id);
//     User.findById(req.user.id,(err,foundUser)=>{
//         if(err){
//             console.log(err);
//         }else{
//             if(foundUser){
//                 foundUser.secret = submittedSecret;
//                 foundUser.save(()=>{
//                     res.redirect("/secrets");
//                 });
//             }
//         }
//     });
// })

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
  
  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
    // console.log(req.user.id);
  
    User.findById(req.user.id, function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = submittedSecret;
          foundUser.save(function(){
            res.redirect("/secrets");
          });
        }
      }
    });
  });
  

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
})

app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/login", (req, res) => {
    const user = new User({
         username :req.body.username,
         password : req.body.password
    });
    
        req.login(user,(err)=>{
            if(err){
                console.log(err);
            }else{
                passport.authenticate("local")(req,res,()=>{
                        res.redirect("/secrets");
                });
            }
        });

  
});


app.listen(port, () => {
    console.log("listen");
});
