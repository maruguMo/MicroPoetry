import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Create a single pg client instance
const pgClient = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

pgClient.connect().catch((err) => console.error('Failed to connect to PostgreSQL', err));

// Utility to get the client instance
export const getDb = async () => pgClient;

// Queries
export const getCommentsByPostId = async (postId) => {
  const db = await getDb();
  const res = await db.query('SELECT * FROM comments WHERE post_id = $1', [postId]);
  return res.rows;
};

export const addComment = async (postId, author, content) => {
  const db = await getDb();
  await db.query(
    'INSERT INTO comments (post_id, author, content) VALUES ($1, $2, $3)',
    [postId, author, content]
  );
};

export async function getFormDefinition(title) {
  const db = await getDb();
  const res = await db.query('SELECT description FROM poetryforms WHERE title = $1', [title]);
  return res.rows[0];
}

export async function getForm(id) {
  const db = await getDb();
  const res = await db.query('SELECT * FROM poetryforms WHERE id = $1', [id]);
  return res.rows[0];
}

export async function fetchForms() {
  const db = await getDb();
  const res = await db.query('SELECT id, title, description FROM poetryforms ORDER BY title ASC');
  return res.rows;
}

export async function updateForms(title, description, id) {
  const db = await getDb();
  await db.query(
    'UPDATE poetryforms SET title = $1, description = $2 WHERE id = $3',
    [title, description, id]
  );
  const res = await db.query('SELECT * FROM poetryforms WHERE id = $1', [id]);
  return res.rows[0];
}

export async function createForm(title, description) {
  const db = await getDb();
  await db.query(
    'INSERT INTO poetryforms (title, description) VALUES ($1, $2)',
    [title, description]
  );
}

export async function getAllPosts() {
  const db = await getDb();
  const res = await db.query(`
    SELECT 
      p.*, 
      COUNT(c.id) AS comments_count
    FROM 
      posts p
    LEFT JOIN 
      comments c ON p.id = c.post_id
    WHERE p.archived = 0   
    GROUP BY 
      p.id
    ORDER BY 
      p.timestamp DESC;
  `);
  return res.rows;
}

export async function getPostById(id) {
  const db = await getDb();
  await db.query('UPDATE posts SET views = views + 1 WHERE id = $1', [id]);
  const res = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
  return res.rows[0];
}

export async function createPost(title, form, content) {
  try {
    const db = await getDb();
    await db.query(
      'INSERT INTO posts (title, form, content, views) VALUES ($1, $2, $3, $4)',
      [title, form, content, 0]
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deletePost(id) {
  const db = await getDb();
  await db.query('DELETE FROM posts WHERE id = $1', [id]);
}

export async function updatePost(id, title, form, content) {
  const db = await getDb();
  await db.query(
    'UPDATE posts SET title = $1, form = $2, content = $3, edit_timestamp = CURRENT_TIMESTAMP WHERE id = $4',
    [title, form, content, id]
  );
}

export async function archivePost(id) {
  const db = await getDb();
  await db.query('UPDATE posts SET archived = 1 WHERE id = $1', [id]);
}

export async function registerUser(email, hash){
  try{
    const db=await getDb();
    const res= await db.query(
                            `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *`,
                            [email,hash]
                            );
    return res.rows[0];
  }catch(error){
      console.log(error);
      return false;
    }
}

export async function findUserByUsername(username){
  const db = await getDb();
  
  try{
    const checkResult=await db.query('SELECT * FROM users WHERE email = $1',[username]);
    return checkResult.rows.length > 0;
  }catch(error){
    console.log(error);
    return false;
  }
}
export async function findOrCreateGoogleUser(profile){
  console.log(profile);
  try{
  const db = await getDb()
  const res = await db.query("SELECT * FROM users WHERE email =$1",
                                                  [profile.email]
  );
  if (!res.rows.length===0 ){
    return res.rows[0];
  }else{
    const newUser = await db.query(
      `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *`,
                                  [profile.email, "google"]
    );
    return newUser.rows[0];
  }
  }catch(error){
    console.log(error);
    return [];
  }
}
export async function getArchivedPosts() {
  const db = await getDb();
  const res = await db.query('SELECT * FROM posts WHERE archived = 1');
  return res.rows;
}

export async function unArchivePost(id) {
  const db = await getDb();
  await db.query('UPDATE posts SET archived = 0 WHERE id = $1', [id]);
}

// Setup function
async function setup() {
  const db = await getDb();
  await db.query(`
            SET session_replication_role = 'replica';

            BEGIN;

            -- Table: comments
            DROP TABLE IF EXISTS comments CASCADE;

            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                post_id INTEGER,
                author TEXT,
                content TEXT,
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                user_id INTEGER REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE,
                FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
            );

            -- Table: PoetryForms
            DROP TABLE IF EXISTS PoetryForms CASCADE;

            CREATE TABLE IF NOT EXISTS PoetryForms (
                id SERIAL PRIMARY KEY,
                Title TEXT,
                Description TEXT
            );

            -- Table: posts
            DROP TABLE IF EXISTS posts CASCADE;

            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                title TEXT,
                form TEXT,
                content TEXT,
                views INTEGER DEFAULT 0,
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                edit_timestamp TIMESTAMPTZ DEFAULT NULL,
                archived BOOLEAN DEFAULT false
            );

            -- Table: Replies
            DROP TABLE IF EXISTS Replies CASCADE;

            CREATE TABLE IF NOT EXISTS Replies (
                Id SERIAL PRIMARY KEY,
                comment_id INTEGER,
                content TEXT,
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE
            );

            -- Table: users
            DROP TABLE IF EXISTS users CASCADE;

            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            COMMIT;

            -- Re-enable foreign key constraints
            SET session_replication_role = 'origin';
  `);
}

// Initialize the database
//setup().catch((err) => console.error('Failed to initialize database', err));

export async function shutdown() {
    console.log('Shutting down gracefully...');
    await db.end();
    process.exit(0);
  }
export default pgClient;
