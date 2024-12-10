import express from 'express';
import os from 'os'
import path from 'path';
import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import morgan from 'morgan';

import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import  env from "dotenv";
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';

import { getAllPosts, getPostById, createPost, deletePost, fetchForms, getCommentsByPostId, addComment, 
  getFormDefinition, updatePost,  archivePost, getArchivedPosts,unArchivePost, updateForms, createForm,
  getForm, findOrCreateGoogleUser, findUserByUsername,
  registerUser
} from './databasePG.js';



const app=express();
const PORT = process.env.APP_PORT || 3001;
const saltrounds =10;
env.config();

const __filename =fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

const options = {
  key: fs.readFileSync(path.join(path.resolve(), 'server.key')),
  cert: fs.readFileSync(path.join(path.resolve(), 'server.cert'))
};

// Middleware to Protect Routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
      maxAge:1000 * 60 * 60 * 24 * 7,
      sameSite: 'strict',
    }
  })
)

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(express.static('js'));
app.use(express.json());

app.use(morgan('combined'));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', './views');

// auth routes
// Login
app.get('/login', (req, res) => {
  res.render('login.ejs')}
); // Login page
app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
  })
);

// Logout
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/login');
  });
});

// Google Authentication
//app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/my-poems",
    failureRedirect: "/login",
  })
);



//route to display poems by currently logged in user
app.get('/my-poems/',ensureAuthenticated, async(req, res)=>{
//to implement this once I add authorization
  // To implement fetching user-specific poems
  // const posts = await getPostsByUser(req.user.id); // Replace with your DB function
  // res.render('my-poems.ejs', { posts });
})


// Route to fetch all posts
app.get('/', async (req, res) => {
    const posts = await getAllPosts();
    const forms=await fetchForms();
    res.render('index.ejs', { posts, forms});
  });



// Get all posts (for AJAX call)
app.get('/posts', async (req, res) => {
    const posts = await getAllPosts();
    res.json(posts);
  });


// Route to fetch a single post. This will increment the view count as well
app.get('/post/:id', async (req, res) => {
    const { id } = req.params;
    const post = await getPostById(id);
    res.json(post);
  });


  // route to get form definition for a poem
app.get('/formDescription/:formName', async(req,res) =>{
    const {formName}=req.params;
    const formDesc= await getFormDefinition(decodeURIComponent(formName));
    res.json(formDesc);
});

//fetch form via its id
app.get('/poetryforms/:id', async(req, res)=>{
  //needs to add error handling so that the application degrades gracefully
  const id=parseInt(req.params.id);
  const form= await getForm(id);
  res.status(200).json(form);

})
app.patch('/poetryforms/:id', async(req, res)=>{
  
  const id=parseInt(req.params.id);
  const desc = req.body.description;
  const title=req.body.title;
  const form= await updateForms(title,desc,id);
  res.status(200).json(form);
})

//route to  fetch poetry formss
app.post('/poetry-forms', async(req,res) =>{
  const id=parseInt(req.body.id);
  const desc=req.body.description;
  const title=req.body.title;
  /* 
    if req.body.id is NaN then this is an insert 
    i.e. create a new poetry form else update for
    corresponding form id 
  */
  if(isNaN(id)){
    try{
      await createForm(title, desc);
      res.status(200).redirect('/poetry-forms');
    }catch(error){
      console.log("error occured", error);
      res.status(500).redirect("/");
    }
  }else{
    try{
      const form= await updateForms(title, desc,id);
      res.status(200).redirect('/poetry-forms')
      
    }catch(error){
      console.log("error occured", error);
      res.status(500).redirect("/");
    }
  }
});

//route to view poetry forms
app.get('/poetry-forms', async(req, res) => {
  const poetryForms = await fetchForms();
  // console.log(poetryForms);
  res.render('poetry-forms.ejs',{poetryForms});
 });

  // Route to fetch comments for a post
app.get('/comments/:postId', async (req, res) => {
    const { postId } = req.params;
    const comments = await getCommentsByPostId(postId);
    res.json(comments);
  });


// Route to create a new post
app.post('/new-poem',ensureAuthenticated, async (req, res) => {
    const title=req.body.title;
    const form=req.body.form;
    const content=req.body.content;

    await createPost(title, form, content);
    res.redirect('/');
  });


// Route to add a new comment
app.post('/comments',ensureAuthenticated, async (req, res) => {
    const { postId, author, content } = req.body;
    await addComment(postId, author, content);
    res.sendStatus(200);
  });


// Route to delete a post
app.post('/delete/:id',ensureAuthenticated, async (req, res) => {
    const { id } = req.params;
    await deletePost(id);
    res.redirect('/');
  });


//route to edit a post/poem
app.post('/edit-post', ensureAuthenticated,async (req, res) => {
  const { post_id, title, form, content } = req.body;
  await updatePost(post_id, title, form, content);
  res.redirect('/');
});


app.post('/archive/:id',ensureAuthenticated, async(req, res) => {
  const {id}=req.params;
  await archivePost(id);
  //res.sendStatus(200);
  res.redirect('/');
});


// Route to fetch all archived posts
app.get('/archived-posts',ensureAuthenticated, async (req, res) => {
  try {
    const archivedPosts = await getArchivedPosts();
    res.json(archivedPosts);
  } catch (error) {
    console.error('Error fetching archived posts:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Route to unarchive a post
app.post('/unarchive/:id',ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    await unArchivePost(id);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error unarchiving post:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.post("/register", async(req, res)=>{
  const email=req.body.username;
  const { password }=req.body;
  if (findUserByUsername(email)){
    req.redirect("/login");
  }else{
    bcrypt.hash(password, process.env.SALTROUNDS,async(err, hash) =>{
      if (err){
        console.error("Error hashing password: ", err);
      }else {
        //register user function here
        const user= registerUser(email,hash);
        req.login(user, (err) =>{
          if(!err){
            res.redirect("/my-poems");
            console.log("success");
          }else{
            console.log(err);
          }
        })
      }
    });
  }
});
// Passport Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await findUserByUsername(username); // Replace with your DB function
      if (!user) return done(null, false, { message: 'User not found' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: 'Invalid password' });

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `http://localhost:${process.env.APP_PORT}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
          const user = await findOrCreateGoogleUser(profile); // Replace with your DB function
          return done(null, user);
      } catch (error) {
          return done(error);
      }
    }
  )
);

// Serialize and Deserialize
passport.serializeUser((user, done) => {
  done(null, user); 
});

passport.deserializeUser(async (user, done) => {
  try {
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});


app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
});


// Function to get the local IP address
function getLocalIP() {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const networkInterface = networkInterfaces[interfaceName];

    // Filter out internal (loopback) and non-IPv4 addresses
    for (const alias of networkInterface) {
      if (alias.family === 'IPv4' && !alias.internal && alias.address.startsWith('192.168')) {
        // Prioritize typical local IP address ranges (e.g., 192.168.x.x)
        return alias.address;
      }
    }
  }

  // Fallback to the first non-internal IPv4 address if 192.168.x.x is not found
  for (const interfaceName in networkInterfaces) {
    const networkInterface = networkInterfaces[interfaceName];
    for (const alias of networkInterface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }

  return 'IP address not found';
}