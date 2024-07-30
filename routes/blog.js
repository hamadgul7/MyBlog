const express = require('express');
const mongodb = require('mongodb');

const router = express.Router();
const db = require('../Data/database')

const ObjectId = mongodb.ObjectId;

router.get('/', function(req, res) {
  res.redirect('/posts');
});

router.get('/posts', async function(req, res) {
  const postData = await db.getDb().collection('posts').find({}, {title: 1, summary: 1, 'author.name': 1}).toArray();
  res.render('posts-list', {postData: postData});
});

router.get('/new-post', async function(req, res) {
  const authors = await db.getDb().collection('authors').find().toArray();
  res.render('create-post', {authors: authors});
});

router.post('/post', async function(req, res, next){
  let authorId;
  try {
    authorId = new ObjectId(req.body.author);
  } catch (error){
    next(error);
  }

  const author = await db.getDb().collection('authors').findOne({_id: authorId })
  const posts = {
    title: req.body.title,
    summary: req.body.summary,
    body: req.body.content,
    date: new Date(),
    author: {
      id: authorId,
      name: author.name,
      email: author.email
    }
  }
  const newPost = await db.getDb().collection('posts').insertOne(posts);
  console.log(newPost);
  res.redirect('/posts');

})

router.get('/post-detail/:id', async function(req, res, next){
  let postId;
  try {
    postId = new ObjectId(req.params.id);
  } catch (error){
    next(error);
  }
    const post = await db.getDb().collection('posts').findOne({_id: postId}, {summary: 0});
    if(!post){
      return res.status(404).render('404');
    }
    post.humanReadableDate = post.date.toLocaleDateString('en-us', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    post.date = post.date.toISOString();
    res.render('post-detail', {postData: post})
})

router.get('/showedit-post/:id/edit', async function(req, res, next){
  let postId;
  try {
    postId = new ObjectId(req.params.id);
  } catch (error){
    next(error);
  }
  const post = await db.getDb().collection('posts').findOne({_id: postId}, {title: 1, summary: 1, body: 1});
  
  if(!post){
    return res.status(404).render('404');
  }

  res.render('update-post', {post: post})
})

router.post('/update-post/:id/edit', async function(req, res, next){
  let postId;
  try {
    postId = new ObjectId(req.params.id);
  } catch (error){
    next(error);
  }

  const updatePost = {
    $set: {
      title: req.body.title,
      summary: req.body.summary,
      body: req.body.content
    }
  }
  const post = await db.getDb().collection('posts').updateOne({_id: postId}, updatePost);
  res.redirect('/posts')
})

router.post('/delete-post/:id', async function(req, res, next){
  let postId;
  try {
    postId = new ObjectId(req.params.id);
  } catch (error){
    next(error);
  }

  const post = await db.getDb().collection('posts').deleteOne({_id: postId});
  if(!post){
    return res.status(404).render('404')
  }
  res.redirect('/posts')

})

module.exports = router;
