const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/book');
const uploadPath = path.join('public', Book.coverImageBasePath);
const Author = require('../models/author');
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']
const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  }
})


// All Books Route
router.get('/', async (req, res) => {
  let query = Book.find();
  if (req.query.title != null && req.query.title != '') {
    query = query.regex('title', newRegExp(req.query.title, 'i'))
  }
  if (req.query.publishedBefore != null && req.query.publishedBefore != '') {
    query = query.lte('publishDate', req.query.publishedBefore);
  }
  if (req.query.publishedAfter != null && req.query.publishedAfter != '') {
    query = query.gte('publishDate', req.query.publishedAfter);
  }
  try {
    const books = await query.exec();
    res.render('books/index', {
      books: books,
      searchOptions: req.query
    });

  } catch {
    res.redirect('/');

  }

});

// New Book Route
router.get('/new', async (req, res) => {
  renderNewPage(res, new Book());
});

// Create Book Route
router.post('/', upload.single('cover'), async (req, res) => {
  const fileName = req.file != null ? req.file.filename : null
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    coverImageName: fileName,
    description: req.body.description
  });
  // console.log('title =' + req.body.title);
  // console.log('author =' + req.body.author);
  // console.log('publishDate =' + new Date(req.body.publishDate));
  // console.log('pageCount =' + req.body.pageCount);
  // console.log('fileName =' + fileName);
  // console.log('Description =' + req.body.description);


  try {
    console.log('inside the try');
    const newBook = await book.save();
    console.log('newBook = ' + newBook);
    // res.redirect(`books/${newBook.id}`)
    res.redirect('books');
  } catch {
    console.log('inside the catch');
    console.log('book coverImage = ' + book.coverImageName);
    if (book.coverImageName != null) {
      removeBookCover(book.coverImageName);
    }
    renderNewPage(res, book, true);
  }
});

function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), err => {
    if (err) console.error(err);
  });
}

async function renderNewPage(res, book, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book
    }
    if (hasError) {
      params.errorMessage = 'Error Creating Book';
    }
    res.render('books/new', params);
  } catch {
    res.redirect('/books');
  }
}

module.exports = router;