
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



const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
let logged = "";
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
mongoose.connect("mongodb://localhost:27017/financeDB",{useNewUrlParser:true});


const userSchema = new  mongoose.Schema({
  username:String,
  password:String,
  googleId:String,
  name:String,
  totalSpent:[{Category:String, Amount:String, Description:String}],
  credit:{type:Number, default: 0},
  currentBalance:{type:Number, default: 0},
  transactions: [{ Type: String, Category: String, Amount:Number, Description:String }]
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
  callbackURL: "http://localhost:3000/auth/google/dashboard"
  // userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id, username:profile.displayName }, function (err, user) {
    return cb(err, user);
  });
}
));




//GET METHODS




app.get("/",function(req,res){
  res.render("landing");
});

app.get("/auth/google",passport.authenticate("google",{ scope: ['profile'] }));

app.get('/auth/google/dashboard', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to/dashboard.
    res.redirect('/dashboard');
  });

app.get("/dashboard",function(req,res){
    if (req.isAuthenticated()){
      let currentBal = 0;
      let fSpent = 0;
      let bSpent = 0;
      let cred = 0;
      let oSpent = 0;
      let tSpent = 0;
      async function display(response){
        const result = await User.find({username:req.user.username}).exec();
        cred = result[0].credit;
        currentBal = result[0].currentBalance
        const res1 = await User.find({"$and": [{"username":"Jatin Sinha"}]},{"totalSpent":1});
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
        response.render("dashboard",{currentBalance:currentBal, totalSpent: tSpent, credit:cred, food:fSpent, bill:bSpent, other:oSpent });
        
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
  res.render("transaction");
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





app.post ("/login", passport.authenticate ("local",{failureRedirect:"/signUp", successRedirect:"/dashboard"}));

app.post("/signUp", async (req, res) => {
  const user = await User. findOne ({ username: req.body.username });
  if (user) return res.status (400) . send("User already exists");
  const newUser = await User.create(req.body);
  res.status (201).redirect("/login");
});

app.post("/add", function(req,res){
  if (req.body.type==="debit"){
    //console.log(req.user.username);
    async function updatef(){
    await User.findOneAndUpdate({username:req.user.username},{$push:{totalSpent:{Category:req.body.category, Amount:req.body.amount, Description:req.body.description}}}).exec();
    await User.findOneAndUpdate({username:req.user.username},{$push:{transactions:{Type: req.body.type, Category:req.body.category, Amount:req.body.amount, Description:req.body.description}}}).exec();
    await User.findOneAndUpdate({username:req.user.username},{$inc:{currentBalance:-req.body.amount}});
  }
  updatef();
  }else if(req.body.type==="credit") {
    async function updatef(){
      await User.findOneAndUpdate({username:req.user.username},{$push:{transactions:{Type: req.body.type, Category:req.body.category, Amount:req.body.amount, Description:req.body.description}}}).exec();
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

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

