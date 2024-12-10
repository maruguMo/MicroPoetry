import express from 'express';
import os from 'os';
import path from 'path';
import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import bcrypt from 'bcrypt';
import passport from 'passport';
import session from 'express-session';
import env from 'dotenv';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';

import {
  getAllPosts, getPostById, createPost, deletePost, fetchForms, getCommentsByPostId, addComment,
  getFormDefinition, updatePost, archivePost, getArchivedPosts, unArchivePost, updateForms, createForm,
  getForm
} from './databasePG.js';

// Initialize
const app = express();
const PORT = 3003;
const saltrounds = 10;
env.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  key: fs.readFileSync(path.join(path.resolve(), 'server.key')),
  cert: fs.readFileSync(path.join(path.resolve(), 'server.cert'))
};

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: 'strict',
    }
  })
);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('js'));
app.use(express.json());
app.use(morgan('combined'));

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// View Engine
app.set('view engine', 'ejs');
app.set('views', './views');

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
      callbackURL: '/auth/google/callback',
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
  done(null, user.id); // Serialize user ID
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id); // Replace with your DB function
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Middleware to Protect Routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Routes

// Login
app.get('/login', (req, res) => res.render('login.ejs')); // Login page
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
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

// Routes requiring authentication
app.get('/my-poems', ensureAuthenticated, async (req, res) => {
  // To implement fetching user-specific poems
  const posts = await getPostsByUser(req.user.id); // Replace with your DB function
  res.render('my-poems.ejs', { posts });
});

app.post('/new-poem', ensureAuthenticated, async (req, res) => {
  const { title, form, content } = req.body;
  await createPost(title, form, content, req.user.id); // Associate poem with logged-in user
  res.redirect('/');
});

app.post('/edit-post', ensureAuthenticated, async (req, res) => {
  const { post_id, title, form, content } = req.body;
  await updatePost(post_id, title, form, content);
  res.redirect('/');
});

app.post('/delete/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  await deletePost(id);
  res.redirect('/');
});

app.post('/archive/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  await archivePost(id);
  res.redirect('/');
});

app.post('/unarchive/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  await unArchivePost(id);
  res.sendStatus(200);
});

// Open/Public Routes
app.get('/', async (req, res) => {
  const posts = await getAllPosts();
  const forms = await fetchForms();
  res.render('index.ejs', { posts, forms });
});

app.get('/posts', async (req, res) => {
  const posts = await getAllPosts();
  res.json(posts);
});

app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  const post = await getPostById(id);
  res.json(post);
});

app.get('/comments/:postId', async (req, res) => {
  const { postId } = req.params;
  const comments = await getCommentsByPostId(postId);
  res.json(comments);
});

app.post('/comments', ensureAuthenticated, async (req, res) => {
  const { postId, author, content } = req.body;
  await addComment(postId, author, content);
  res.sendStatus(200);
});

// Start Server
https.createServer(options, app).listen(PORT, () => {
  console.log(`Server is running at https://localhost:${PORT}`);
});
