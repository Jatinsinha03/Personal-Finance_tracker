// app.get("/posts/:postId", function(req, res){
  

//   const requestedPostId = req.params.postId;
  
//     Blog.findOne({_id: requestedPostId}).then((post)=>{
//       res.render("post", {
//         title: post.title,
//         content: post.content
//       });
//     }).catch((err)=>{
//       console.log(err);
//     })
    
//   });

//POST METHODS

// app.post("/compose",function(req,res){
//   const blog1 = new Blog({
//     title:req.body.postTitle,
//     content:req.body.postDesc
//   });

//   blog1.save(); 
//   async function findId(){
//       const query = User.findOneAndUpdate({username: req.user.username},{$push:{blog:blog1}});
//       const foundUser = await query.exec();
//       await foundUser.save();
//       res.redirect("/home");
//   }
//   findId();
// });

// app.post("/post",function(req,res){
//   const name = req.body.postName;
//   res.redirect("/post/"+name);
// });

// app.post("/navs",function(req,res){
//   console.log(req.body.navss);
// });

// app.get("/contact",function(req,res){
//   res.render("contact",{contactText:contactContent});
// })

// app.get("/about",function(req,res){
//   res.render("about",{aboutText:aboutContent});
// });

// app.get("/compose",function(req,res){
//   if (req.isAuthenticated()){
//   res.render("compose");}else{
//     res.redirect("/login");
//   }
// })