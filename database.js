import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPromise = open({
  filename: './database.db',
  driver: sqlite3.Database
});
export const getDb = async () => {
  return dbPromise;
};


export const getCommentsByPostId = async (postId) => {
  const db = await getDb();
  return db.all('SELECT * FROM comments WHERE post_id = ?', postId);
};

export const addComment = async (postId, author, content) => {
  const db = await getDb();
  return db.run('INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)', postId, author, content);
};
export async function getFormDefinition(Title){
  const db =await getDb();
  return  await db.get('SELECT Description FROM PoetryForms WHERE Title = ?',Title);
}

export async function getForm(id){
  const db = await getDb();
  //asuming there are no errors during the fetch operation
  return await db.get(`SELECT * FROM PoetryForms WHERE id = ?`, id);
  
}
export async function fetchForms() {
  const db = await getDb();
  const forms=await db.all('SELECT Id, Title, Description FROM PoetryForms ORDER BY Title ASC');
  return forms;
}
export async function updateForms(Title, Description, Id){
  const db =await getDb();
  await db.run('UPDATE PoetryForms SET Title = ?, Description= ? WHERE id = ?', Title, Description, Id);
  return await db.get('SELECT * FROM PoetryForms WHERE id = ?',Id);
}

export async function createForm(Title, Description){
  const db=await getDb();
  return  db.run(`INSERT INTO PoetryForms(Title, Description) VALUES(?,?)`,Title, Description);
}
export async function getAllPosts() {
  const db = await getDb();
  return await db.all(`
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
    `
  );
}

export async function getPostById(id) {
  const db = await getDb();
  await db.run('UPDATE posts SET views = views + 1 WHERE id = ?', id);
  return await db.get('SELECT * FROM posts WHERE id = ?', id);
}

export async function createPost(title, form, content) {

  try{
    const db = await getDb();

    const post= await db.run('INSERT INTO posts (title, form, content, views) VALUES (?, ?, ?, ?)', title, form, content, 0);
    // console.log(post);
    return post;
  }
  catch(error){
    console.log(error)
    return error;
  }
  
}

export async function deletePost(id) {
  const db = await getDb();
  await db.run('DELETE FROM posts WHERE id = ?', id);
}
export async function updatePost(id, title, form, content) {
  const db = await getDb();
  await db.run('UPDATE posts SET title = ?, form = ?, content = ?, edit_timestamp = CURRENT_TIMESTAMP WHERE id = ?', title, form, content, id);
}
export async function archivePost(id){
  const db=await getDb();
  await db.run('UPDATE posts SET archived = 1 WHERE id =?', id);
}
export async function getArchivedPosts(){
  const db=await getDb();
  return await db.all('SELECT * FROM posts WHERE archived =1')
}

export async function unArchivePost(id){
  const db =await getDb();
  await db.run('UPDATE posts SET archived = 0 WHERE id =?', id);
}

async function setup() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      form TEXT,
      views INTEGER DEFAULT 0,
      archived INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      edit_timestamp DATETIME
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      author TEXT,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS PoetryForms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Title TEXT,
      Description TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

setup();
export default dbPromise;
