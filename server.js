const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' )

var userSchema = new mongoose.Schema({user:String});
var userModel = mongoose.model('userModel',userSchema);

var exerciseSchema = new mongoose.Schema({userId:String,
                                     description:String,
                                     duration:Number,
                                     date:Date});
var exerciseModel = mongoose.model('exerciceModel',exerciseSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/exercise/users',(req,res)=>{
   
  var tab = userModel.find({},(err,data)=>{
  if(err) return(err);
  res.send(data);
  });
  
});

app.get('/exercise',(req,res)=>{
   
  var tab = exerciseModel.find({},(err,data)=>{
  if(err) return(err);
  res.send(data);
  });
  
});

app.get('/api/exercise/log',(req,res)=>{
  var urlTaille = Object.keys(req.query).length;
  var id = req.query.userId;
  if(id ===undefined || !id.match(/^[0-9a-fA-F]{24}$/)) return res.send('unknow _id');
  var log = {_id:'',
             username:'',
             count:0,
             log:[]};
  
  if(urlTaille === 1){
    exerciseModel.find({userId:id},(err,data)=>{
    if(err) throw err;
    log.count = data.length;
    log._id=id;
    data.forEach(function(x){
      
      log.log.push({'description':x.description,
                                     'duration':x.duration,
                                     'date':x.date});
    });
    
    userModel.findById(id,(err,data)=>{
    if(err) throw err;
    log.username = data.user;
    res.send(log);

      });
    });
  }
  else if(urlTaille === 3){
    var dated = new Date(req.query.from);
    var datef = new Date(req.query.to);
    console.log(dated,datef);
    exerciseModel.find({userId:id,date:{'$gte':dated,'$lte':datef}},(err,data)=>{
    if(err) throw err;
    log.count = data.length;
    log._id=id;
    console.log(data);
    data.forEach(function(x){
      
      log.log.push({'description':x.description,
                                     'duration':x.duration,
                                     'date':x.date});
    });
    
  
    userModel.findById(id,(err,data)=>{
    if(err) throw err;
    log.username = data.user;
    res.send(log);

    });
  });
  }
  else if(urlTaille === 2){
    exerciseModel.find({userId:id},null,{limit: parseInt(req.query.limit)},(err,data)=>{
    if(err) throw err;
    log.count = data.length;
    log._id=id;
    data.forEach(function(x){
      
      log.log.push({'description':x.description,
                                     'duration':x.duration,
                                     'date':x.date});
    });
    
  
    userModel.findById(id,(err,data)=>{
    if(err) throw err;
    log.username = data.user;
    res.send(log);

    });
  });  
  }
  else{
    res.send('url not found');
  }
  
  
  
});

app.post('/api/exercise/new-user',(req,res)=>{
  userModel.find({'user':req.body.username},(err,data)=>{
    if(data.length>0){
      res.send('Username already taken');
    }
    else{
      var userSave = new userModel({user:req.body.username});
      
      userSave.save((err,data)=>{
      if(err) return (err);
      console.log('username save')});
      
      res.send(userSave);
      
    }
  });
});

app.post('/api/exercise/add',(req,res)=>{
  if(!req.body.userId || !req.body.userId.match(/^[0-9a-fA-F]{24}$/)) return res.send('unknow _id');
  if(!req.body.description) return res.send('description path required');
  if(!req.body.duration || !parseInt(req.body.duration)) return res.send('duration path required or invalid');
  
  userModel.findById(req.body.userId,(err,data)=>{
  if(err) throw err;
  if(req.body.date ===''){
    req.body.date = new Date().toDateString();
    var exerciseSave = new exerciseModel({userId:req.body.userId,
                                     description:req.body.description,
                                     duration:req.body.duration,
                                     date:req.body.date});
  
    exerciseSave.save((err,data)=>{
    if(err) throw err;
    console.log('exercise save');
  });
  }
  else{
    req.body.date = new Date(req.body.date).toDateString();
    if(req.body.date === 'Invalid Date'){ return res.send('Invalid date');}
    else{
      var exerciseSave = new exerciseModel({userId:req.body.userId,
                                     description:req.body.description,
                                     duration:req.body.duration,
                                     date:req.body.date});
  
      exerciseSave.save((err,data)=>{
        if(err) throw err;
        console.log('exercise save');
      });
    }
  }
  
  
  const test = Object.assign({username: data._doc.user},req.body);
  res.send(test);
  });
  
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

