const express = require('express');
const users = require('../models/users').users;
const posts = require('../models/posts').posts;
const follows = require('../models/follows').follows;
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const route = express.Router();


//api to verify user
route.get('/verify_user',(req,res)=>{
    if(req.user){
        return res.send(req.user.username);
    } else {
        return res.send(undefined);
    }
})

//creating storage_engine
const storage_engine = multer.diskStorage({
    destination: './public/post_assets',
    filename: function(req,file,done){
    
        done(null,"posts"+Date.now()+path.extname(file.originalname));//path.extname can extract extension name from file name
    }
});

//creating fileFilter function

const customFileFilter = function(req,file,done){
    const regex= /\jpg$|\jpeg$|\png$|\gif$/

    const check_filename = regex.test(file.originalname);

    const check_mimetype= regex.test(file.mimetype);

    if(check_filename && check_mimetype){
        done(null,true);
    } else {
        done('Error: Images only');
    }
}

const upload = multer({
    storage: storage_engine,
    limits: {fileSize: 1000000},
    fileFilter: customFileFilter
}).single('post_image');  //name should be post_image


//handling post request containing the file
route.post('/post/add',(req,res)=>{

    let create_post = function(){
        posts.create({
            username: req.body.username,
            head: req.body.head,
            text: req.body.text,
            image: req.file.filename
        }, function(err,docs){
            if(err){
                console.log("Error while adding in /post/add");
                console.log(err);
                return res.send(undefined);
            }
    
            if(docs){
                console.log("post created successfully in /courses/add");
                return docs;
            } else {
                console.log("unsuccessful in /post/add");
                return undefined;
            }
        })
    }

    if(req.body.post_image){

        upload(req,res,(err)=>{
            if(err){
                console.log("Error occured in /post/add");
                return res.send(undefined);
            } else {
                if(req.file === undefined){
                    console.log("file not uploaded in /post/add");
                    return res.send(undefined);
                } else {
                    console.log("Picture successfully uploaded");
    
                    let docs = create_post();
                    return res.send(docs);
                }
            }
        })

    } else {
        let docs = create_post();
        return res.send(docs);
    }

})

//following user
route.post('/user/follow',(req,res)=>{
    let query = {username: req.user.username, following: req.body.username};
    let update = {
        username: req.user.username,
        following: req.body.username
    };
    let options = { upsert: true, new: true, setDefaultsOnInsert: true };
    follows.findOneAndUpdate(query, update, options, function(err,docs){
        if(err){
            console.log('Error occured in /user/follow');
            console.log(err);
            return res.send(undefined);
        }

        if(docs){
            console.log("docs found in /user/follow");
            return res.send(docs);
        } else {
            console.log("No Such docs");
            return res.send(undefined);
        }
    })
})

//unfollow user
route.post('/user/unfollow',(req,res)=>{
    let query = {username: req.user.username, following: req.body.username};
    follows.findOneAndDelete(query, function(err){
        if(err){
            console.log('Error occured in /user/unfollow');
            console.log(err);
            return res.send(undefined);
        }

        return res.send("success");
    })
})


//api to render profile or profile view page
route.get('/:username',(req,res,next)=>{

    console.log('finding user');
    if(req.user){

      if(req.user.username == req.params.username){
        return res.sendFile(path.join(__dirname,'..','public','profile','index.html'));

      } else {

        users.findOne({username: req.params.username} , function (err,user){
            if(err){
                console.log('user not found due to error 1');
                return res.redirect('/error_404');
                //return done(err);
            }

            if (!user) {
                console.log('user not found 1');
                return res.redirect('/error_404');
                //return done(null, false, {message: "No such user"})
              }
      
              console.log('success in finding user');
    
              return res.sendFile(path.join(__dirname,'..','public','viewuser','index.html'));
      
              //return done(null, user);


        } ); 

      }

    } else {

      users.findOne({ username: req.params.username } , function (err,user){
          if(err){
            console.log('user not found due to error 2');
            return res.redirect('/error_404');
            //return done(err);
          }

          if (!user) {
            console.log('user not found 2');
            return res.redirect('/error_404');
            //return done(null, false, {message: "No such user"})
          }
  
          console.log('success in finding user');
  
          return res.sendFile(path.join(__dirname,'..','public','viewuser','index.html'));
  
          //return done(null, user);

      });

    }  
})



module.exports = {
    route
}
