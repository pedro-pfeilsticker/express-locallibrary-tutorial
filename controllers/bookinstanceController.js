const async = require('async');
const { body, validationResult } = require('express-validator');
var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

exports.bookinstance_list = (req, res, next) => {
    
    BookInstance
    .find()
    .populate('book')
    .exec((err, list_bookinstances) => {
        if(err) { return next(err); }
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances});
    });
};

exports.bookinstance_detail = (req, res, next) => {
    
    BookInstance
    .findById(req.params.id)
    .populate('book')
    .exec((err, bookInstance) => {
        if (err) { return next(err); }
        if (bookInstance==null) {
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        res.render('bookinstance_detail', { title: `Copy: ${bookInstance.book.title}`, bookinstance: bookInstance });
    });
};

exports.bookinstance_create_get = (req, res) => {
    
    Book
    .find({}, 'title')
    .exec((err, books) => {
        if (err) { return next(err); }
        res.render('bookinstance_form', { title: 'Create Book Instance', book_list: books });
    });
};

exports.bookinstance_create_post = [
    
    body('book', 'Book must be specified').trim().isLength({ min: 1}).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true}).isISO8601().toDate(),
    
    (req, res, next) => {
    
        const errors = validationResult(req);

        var bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back    
        });

        if (!errors.isEmpty()) {
            
            Book
            .find({}, 'title')
            .exec((err, books) => {
                if (err) { return next(err); }
                res.render('bookinstance_form', { title: 'Create Book Instance', book_list: books, selected_book: bookInstance.book._id, errors: errors.array(), bookinstance: bookInstance });
            });
            return;
        } else {
            bookInstance.save((err) => {
                if (err) { return next(err); }
                res.redirect(bookInstance.url);
            });
        }
    }
    
];

exports.bookinstance_delete_get = (req, res, next) => {

    BookInstance    
    .findById(req.params.id)
    .exec((err, bookInstance) => {
        if (err) { return next(err); }
        if(bookInstance==null) {
            res.redirect('/catalog/bookinstances');
        }    
        res.render('bookinstance_delete', { title: 'Delete Book Instance', bookinstance: bookInstance });
    });
};

exports.bookinstance_delete_post = (req, res, next) => {
    
    BookInstance.
    findByIdAndRemove(req.body.bookinstanceid, function deleteBookInstance(err) {
        if (err) { return next(err); }
        res.redirect('/catalog/bookinstances');    
    });
};

exports.bookinstance_update_get = (req, res, next) => {
    
    async.parallel({
        bookInstance: function(callback) {
            BookInstance
            .findById(req.params.id)
            .populate('book')
            .exec(callback);
        },
        books: function(callback) {
            Book
            .find({}, 'title')
            .exec(callback);
        }
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.bookInstance==null) {
            var err = new Error('Copy not found');
            err.status = 404;
            return next(err);
        } else {
            res.render('bookinstance_form', { title: 'Update Book Instance', bookinstance: results.bookInstance, book_list: results.books });
        }
    });
};

exports.bookinstance_update_post = [
    
    body('book', 'Book must be specified').trim().isLength({ min: 1}).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true}).isISO8601().toDate(),
    
    (req, res, next) => {
    
        const errors = validationResult(req);

        var bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id    
        });

        console.log(bookInstance.due_back);

        if (!errors.isEmpty()) {
            
            Book
            .find({}, 'title')
            .exec((err, books) => {
                if (err) { return next(err); }
                res.render('bookinstance_form', { title: 'Update Book Instance', book_list: books, errors: errors.array(), bookinstance: bookInstance });
            });
            return;
        } else {
            BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {}, (err, thebookinstance) => {
                if (err) { return next(err); }
                res.redirect(thebookinstance.url);
            });
        }
    }
    
];