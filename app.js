require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const PORT = process.env.PORT || 3000;

let postDescs = [];


const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
  secret: 'Our big secret.',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

//Setting Up mongoose
mongoose.connect("mongodb+srv://jatinsinha03:admin@cluster0.5enu7dl.mongodb.net/?retryWrites=true&w=majority",{useNewUrlParser:true});


const userSchema = new  mongoose.Schema({
  username:String,
  password:String,
  googleId:String,
  name:{type:String, default: null},
  totalSpent:[{Category:String, Amount:String, Description:String, Date:String}],
  credit:{type:Number, default: 0},
  currentBalance:{type:Number, default: 0},
  transactions: [{ Type: String, Category: String, Amount:Number, Description:String, Date:String }]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(
  new LocalStrategy(async (username, password, done) => {
  try {
      const user = await User. findOne ({ username });
  if (!user) return done(null, false);
  if (user.password !== password) return done(null, false);
  return done (null, user);
} catch (error) {
  return done (error, false);
  }}));


passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});
passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: "1091782084961-h5j887mjljdgqkks5babrm38hvhssgcs.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "https://finance-wise.onrender.com/auth/google/dashboard"
  // callbackURL: "http://localhost:3000/auth/google/dashboard"
  // userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id, username:profile.displayName }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/auth/google",passport.authenticate("google",{ scope: ['profile'] }));


//GET METHODS




app.get("/",function(req,res){
  res.render("landing");
});


app.get('/auth/google/dashboard', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to/dashboard.
    res.redirect('/dashboard');
  });



app.get("/dashboard",function(req,res){
    if (req.isAuthenticated()){
      
      let currentBal = 0; let fSpent = 0; let bSpent = 0; let cred = 0; let oSpent = 0;let tSpent = 0;
      let types = []; let categories = []; let amounts3 = []; let descs3 = []; let dates = [];
      async function display(response){
        const result = await User.find({username:req.user.username}).exec();
        let name1=result[0].name;
        if (name1===null){
          name1=req.user.username;
        }
        cred = result[0].credit;
        currentBal = result[0].currentBalance
        const res1 = await User.find({"$and": [{"username":req.user.username}]},{"totalSpent":1});
        const fLength = res1[0].totalSpent.length;
        for (var i=0;i<fLength;i++){
          if (res1[0].totalSpent[i].Category==="food"){
            fSpent = +fSpent+ +(res1[0].totalSpent[i].Amount); 
          } else if (res1[0].totalSpent[i].Category==="bills"){
            bSpent = +bSpent + +(res1[0].totalSpent[i].Amount);
          } else if (res1[0].totalSpent[i].Category==="others"){
            oSpent = +oSpent + +(res1[0].totalSpent[i].Amount);
          }
        } 
        tSpent=fSpent+bSpent+oSpent;
        const res2 = await User.find({"$and": [{"username":req.user.username}]},{"transactions":1});
        const ll = res2[0].transactions.length;
        for(var i=0;i<ll;i++){
          types.push(res2[0].transactions[i].Type);
          categories.push(res2[0].transactions[i].Category);
          amounts3.push(res2[0].transactions[i].Amount);
          descs3.push(res2[0].transactions[i].Description);
          dates.push(res2[0].transactions[i].Date)
        }

        
        response.render("dashboard",{date:dates,name:name1,type:types, category:categories, amount:amounts3, description:descs3 ,currentBalance:currentBal, totalSpent: tSpent, credit:cred, food:fSpent, bill:bSpent, other:oSpent });
      }
      display(res);
    
    }
    else{
      res.redirect("/login");
    }   
    
});

app.get("/signUp",function(req,res){
  res.render("signUp");
});

app.get("/transaction",function(req,res){
  if (req.isAuthenticated()){
    res.render("transaction");
  }else{
    res.redirect("/login");
  }
  
})



app.get("/login",function(req,res){
  res.render("landing");
});

app.get("/logout",function(req,res){
  req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});

app.get("/food",function(req,res){
  if (req.isAuthenticated()){
  async function display(){
    let amounts = [];
    let descs = []; let dates1 = []
    let tAmount = 0;
    const res1 = await User.find({"$and": [{"username":req.user.username}]},{"totalSpent":1});
    const l = res1[0].totalSpent.length;
    // console.log(l);
    // console.log(res1[0].totalSpent[0]);
    for(var i=0;i<l;i++){
      if (res1[0].totalSpent[i].Category=="food"){
        tAmount = +tAmount + +res1[0].totalSpent[i].Amount;
        amounts.push(res1[0].totalSpent[i].Amount)
        descs.push(res1[0].totalSpent[i].Description);
        dates1.push(res1[0].totalSpent[i].Date)
      }
    }res.render("food", {date:dates1,totalFood:tAmount, amount:amounts, description:descs});

  }
  display()
}else{
  res.redirect("/login");
}});

app.get("/bills",function(req,res){
  if (req.isAuthenticated()){
  async function display(){
    let amounts1 = [];
    let descs1 = [];
    let tAmount1 = 0; let dates2 = [];
    const res1 = await User.find({"$and": [{"username":req.user.username}]},{"totalSpent":1});
    const l = res1[0].totalSpent.length;
    for(var i=0;i<l;i++){
      if (res1[0].totalSpent[i].Category=="bills"){
        tAmount1 = +tAmount1 + +res1[0].totalSpent[i].Amount;
        amounts1.push(res1[0].totalSpent[i].Amount)
        descs1.push(res1[0].totalSpent[i].Description);
        dates2.push(res1[0].totalSpent[i].Date);
      }
    }res.render("bills", {date:dates2,totalBill:tAmount1, amount:amounts1, description:descs1});

  }
  display()
  }else{
    res.redirect("/login");
  }});

app.get("/others",function(req,res){
  if (req.isAuthenticated()){
  async function display(){
    let amounts2 = [];
    let descs2 = [];
    let tAmount2 = 0; let dates3 = [];
    const res1 = await User.find({"$and": [{"username":req.user.username}]},{"totalSpent":1});
    const l = res1[0].totalSpent.length;
    for(var i=0;i<l;i++){
      if (res1[0].totalSpent[i].Category=="others"){
        tAmount2 = +tAmount2 + +res1[0].totalSpent[i].Amount;
        amounts2.push(res1[0].totalSpent[i].Amount)
        descs2.push(res1[0].totalSpent[i].Description);
        dates3.push(res1[0].totalSpent[i].Date);
      }
    }res.render("others", {date:dates3,totalOther:tAmount2, amount:amounts2, description:descs2});

  }
  display()
}else{
  res.redirect("/login");
}});

app.get("/logout",function(req,res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

app.post ("/login", passport.authenticate ("local",{failureRedirect:"/signUp", successRedirect:"/dashboard"}));

app.post("/signUp", async (req, res) => {
  const user = await User. findOne ({ username: req.body.username });
  if (user) return res.status (400) . send("User already exists");
  const newUser = await User.create(req.body);
  res.status (201).redirect("/login");
});

app.post("/add", function(req,res){
    const date = new Date();

    let currentDay= String(date.getDate()).padStart(2, '0');

    let currentMonth = String(date.getMonth()+1).padStart(2,"0");

    let currentYear = date.getFullYear();

    // we will display the date as DD-MM-YYYY 

    let currentDate1 = `${currentDay}-${currentMonth}-${currentYear}`;
    let time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    let currentDate = currentDate1 + " " + time;

  if (req.body.type==="debit"){
    //console.log(req.user.username);
    async function updatef(){
    await User.findOneAndUpdate({username:req.user.username},{$push:{totalSpent:{Category:req.body.category, Amount:req.body.amount, Description:req.body.description, Date:currentDate}}}).exec();
    await User.findOneAndUpdate({username:req.user.username},{$push:{transactions:{Type: req.body.type, Category:req.body.category, Amount:req.body.amount, Description:req.body.description, Date:currentDate}}}).exec();
    await User.findOneAndUpdate({username:req.user.username},{$inc:{currentBalance:-req.body.amount}});
  }
  updatef();
  }else if(req.body.type==="credit") {
    async function updatef(){
      await User.findOneAndUpdate({username:req.user.username},{$push:{transactions:{Type: req.body.type, Category:req.body.category, Amount:req.body.amount, Description:req.body.description, Date:currentDate}}}).exec();
      await User.findOneAndUpdate({username:req.user.username},{$inc:{credit:req.body.amount}});
      await User.findOneAndUpdate({username:req.user.username},{$inc:{currentBalance:req.body.amount}});
      
    }
    updatef();
  }
  res.redirect("/dashboard");
  // console.log(req.body.type);
  // console.log(req.body.category);
  // console.log(req.body.amount);
  // console.log(req.body.description);
})

app.listen(PORT, function() {
  console.log("Server started on port 3000");
});

