import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { getAllPosts, getPostById, createPost, deletePost, fetchForms, getCommentsByPostId, addComment, 
  getFormDefinition, updatePost,  archivePost, getArchivedPosts,unArchivePost
} from './database.js';

const app=express();
const PORT = 3000;
const __filename =fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(express.static('js'));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', './views');

// Route to fetch all posts
app.get('/', async (req, res) => {
    const posts = await getAllPosts();
    const forms=await fetchForms();
    res.render('index', { posts, forms});
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
  // Route to fetch comments for a post
app.get('/comments/:postId', async (req, res) => {
    const { postId } = req.params;
    const comments = await getCommentsByPostId(postId);
    res.json(comments);
  });
//route to view poetry forms
app.get('/poetry-forms', (req, res) => {
   res.render('poetry-forms');
 });
// Route to create a new post
app.post('/post', async (req, res) => {
    const { title, form, content } = req.body;
    await createPost(title, form, content);
    res.redirect('/');
  });
// Route to add a new comment
app.post('/comments', async (req, res) => {
    const { postId, author, content } = req.body;
    await addComment(postId, author, content);
    res.sendStatus(200);
  });
// Route to delete a post
app.post('/delete/:id', async (req, res) => {
    const { id } = req.params;
    await deletePost(id);
    res.redirect('/');
  });
//route to edit a post/poem
app.post('/edit-post', async (req, res) => {
  const { post_id, title, form, content } = req.body;
  await updatePost(post_id, title, form, content);
  res.redirect('/');
});
app.post('/archive/:id', async(req, res) => {
  const {id}=req.params;
  await archivePost(id);
  //res.sendStatus(200);
  res.redirect('/');
});
// Route to fetch all archived posts
app.get('/archived-posts', async (req, res) => {
  try {
    const archivedPosts = await getArchivedPosts();
    res.json(archivedPosts);
  } catch (error) {
    console.error('Error fetching archived posts:', error);
    res.status(500).send('Internal Server Error');
  }
});
// Route to unarchive a post
app.post('/unarchive/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await unArchivePost(id);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error unarchiving post:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.listen(PORT, ()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
});