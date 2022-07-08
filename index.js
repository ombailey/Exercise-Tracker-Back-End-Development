const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const bodyParser = require("body-parser");
const mySecret = process.env['MONGO_URI']
mongoose.connect(mySecret, function(error){
  console.log("connected");
});
console.log(mongoose.connection.readyState)

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({extended:false}));

const userSchema = new mongoose.Schema({
  username: "String",
  description: "String",
  duration: Number,
  // date: {type: "Date", default: new Date().toDateString()},
  log: ["Mixed"]
})
const User = mongoose.model("User", userSchema);

// Post for creating a new user or displaying a existed one.
app.post("/api/users", function (req,res){
  let user = req.body.username;

  User.findOne({username: user}, function(error,foundUser){
    if (error) console.log("find one error");
    if (!foundUser){
      const newUser = new User({username: user});
      newUser.save(function(error, saved){
        if (error) cosole.log("Save error");
      res.json({username: newUser.username, _id: newUser.id});
      })
    } else {
      res.json({username: foundUser.username, _id: foundUser.id})
    }
  })
})

// Get request for all users.
app.get("/api/users", function(req,res){
  User.find({}, function(error,users){
    if (error) console.log("Find Users Error");
    res.send(users)
  })
})

// Add exercise descriptions
app.post("/api/users/:id/exercises", function(req,res){
  const userId = req.params["id"];
  const newDescription = req.body.description;
  const newDuration = req.body.duration;
  
  User.findOne({_id: userId}, function(error, foundUser){
    if (error) console.log("Find User Error");
    if (!foundUser) res.send("No User Found.");
    if (req.body.date){  
     const newDate = new Date(req.body.date).toDateString();
    User.findOneAndUpdate({_id:userId}, {description: newDescription, duration: newDuration, date: newDate, $push: {log:{description: newDescription, duration: parseInt(newDuration), date: newDate} }}, {new: true}, function(error, updated){
      if (error) console.log("Update User Error.")
      res.json({_id: updated.id, username: updated.username, description: updated.description, duration: updated.duration, date: newDate })
    })
    } else {
      let currentDate = new Date().toDateString();
      User.findOneAndUpdate({_id:userId}, {description: newDescription, duration: newDuration, $push: {log:{description:newDescription, duration: parseInt(newDuration), date: currentDate} }}, {new: true}, function(error, updated){
      if (error) console.log("Update User Error.")
          
        res.json({_id: updated.id, username: updated.username, description: updated.description, duration: updated.duration, date: currentDate})
      })
    }
  })
})

// Display log of exercises
app.get("/api/users/:_id/logs", function(req,res){
  const userId = req.params["_id"];
  const from = new Date(req.query.from).getTime();
  const to = new Date(req.query.to).getTime();
  const limit = req.query.limit
  
  User.findById(userId, function(error,foundUser){
    if (error) console.log("User Log Search Error");
    if (from){
    foundUser.log = foundUser.log.filter(ex => new Date(ex.date).getTime() >= from); 
    }
    if(to){
      foundUser.log = foundUser.log.filter(ex => new Date(ex.date).getTime() <= to); 
      }
    if (from){
      console.log(foundUser.log)
      }
    if (limit){
      foundUser.log = foundUser.log.splice(0,limit);
      }

    let logCount = foundUser.log.length;
    res.json({_id: foundUser.id, username: foundUser.username, count: logCount, log: foundUser.log})
  })
  })



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
