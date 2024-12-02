import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Create a single pg client instance
const pgClient = new Client({
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
  const res = await db.query('SELECT Description FROM PoetryForms WHERE Title = $1', [title]);
  return res.rows[0];
}

export async function getForm(id) {
  const db = await getDb();
  const res = await db.query('SELECT * FROM PoetryForms WHERE id = $1', [id]);
  return res.rows[0];
}

export async function fetchForms() {
  const db = await getDb();
  const res = await db.query('SELECT Id, Title, Description FROM PoetryForms ORDER BY Title ASC');
  return res.rows;
}

export async function updateForms(title, description, id) {
  const db = await getDb();
  await db.query(
    'UPDATE PoetryForms SET Title = $1, Description = $2 WHERE id = $3',
    [title, description, id]
  );
  const res = await db.query('SELECT * FROM PoetryForms WHERE id = $1', [id]);
  return res.rows[0];
}

export async function createForm(title, description) {
  const db = await getDb();
  await db.query(
    'INSERT INTO PoetryForms (Title, Description) VALUES ($1, $2)',
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
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT,
      content TEXT,
      form TEXT,
      views INTEGER DEFAULT 0,
      archived BOOLEAN DEFAULT false,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      edit_timestamp TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER,
      author TEXT,
      content TEXT,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS PoetryForms (
      id SERIAL PRIMARY KEY,
      Title TEXT,
      Description TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

// Initialize the database
setup().catch((err) => console.error('Failed to initialize database', err));

export default pgClient;
