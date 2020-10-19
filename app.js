require('dotenv').config();// for level 3
const express=require('express');
const ejs=require('ejs');
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
// const encrypt=require("mongoose-encryption");  /// for level 2 encryption
// const md5=require('md5');  // for level 4
// const bcrypt= require("bcrypt"); // for level 5
// const saltRounds=10;

const session=require('express-session')
const passport=require('passport');
const paassportLocalMongoose=require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate=require('mongoose-findorcreate')


const app = express()
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize());
app.use(passport.session()); 



mongoose.connect("mongodb+srv://admin-secret:Parasgarg123@cluster0.5mlfk.mongodb.net/secret?retryWrites=true&w=majority", { useNewUrlParser: true , useUnifiedTopology: true });
mongoose.set("useCreateIndex",true)

const userSchema=new mongoose.Schema({
    email: String,
    password: String,
    googleId:String,
    facebookId:String,
    secret:String
});


userSchema.plugin(findOrCreate)
userSchema.plugin(paassportLocalMongoose)
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

const User=mongoose.model("User",userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
    done(null,user.id)
});
passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user)
    })
});




passport.use(new GoogleStrategy({
    clientID: "1002258577961 - om9j1aa2lfdaifaec2fjf1loirhjo9rh.apps.googleusercontent.com" ,
    clientSecret: "vadilg9J7HPnJ5igKdJzSu8A",
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL:"https://www.googleapi.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {

        User.findOrCreate({ googleId: profile.id }, function (err, user) {
                return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: "1241857026193402",
    clientSecret: "e7eb5de128250f1ddb53183377fe9b0a",
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));



app.get("/",function(req,res){
    res.render("home");
})

app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get("/auth/google",
    passport.authenticate("google",{scope:['profile']}) 
)

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/secrets');
    });

app.get("/login", function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})

// app.post("/register",function(req,res){
    // bcrypt.hash(req.body.password, saltRounds).then(function (hash) {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //         // password: md5(req.body.password)  /// used for creating hash value
    //     })
    
   
    //  newUser.save(function(err){
    //      if(err){
    //          console.log(err);
    //      }
    //      else{
    //          res.render("secrets");
    //      }
    //  });
    // });
// })
app.get("/secrets",function(req,res){
   User.find({"secret" :{$ne:null}},function(err,foundUser){
       if(err)
            console.log(err);
        else{
            if(foundUser){
                res.render("secrets",{userWithSecrets:foundUser})
            }
        }
   } )
})


app.get("/submit",function(req,res){
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/")
})

app.post("/submit",function(req,res){
    User.findById(req.user.id,function(err,foundUser){
        if(err)
            console.log(err)
        else {
            if(foundUser){
                foundUser.secret=req.body.secret;
                foundUser.save(function(){
                    res.redirect("/secrets")
                })
            }
        }

    })
})

app.post('/register',function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
         
    }) 
})


// app.post("/login",function(req,res){
    // User.findOne({email:req.body.username},function(err,foundUser){
    //     if(err)
    //         console.log(err);
    //     else{
    //         if(foundUser){
    //             bcrypt.compare(req.body.password, foundUser.password,function(err,result){
    //                 if(result==true)
    //                     res.render('secrets');
    //             });
                    
    //         } 
    //             else    
    //                 console.log("password does not match")
    //         }
        
    // })
// }) 


app.post("/login",function(req,res){
    const user=new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user,function(err){
        if(err)
            console.log(err);
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
})

app.listen(3000,function(){
    console.log("server is started on port 3000");
})
