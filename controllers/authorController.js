const Author = require("../models/author");
const async = require("async");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all Authors.
exports.author_list = async function (req, res, next) {
  try {
    const list_authors = await Author.find()
      .sort([["family_name", "ascending"]])
      .exec();
    res.render("author_list", {
      title: "Author List",
      author_list: list_authors,
    });
  } catch (err) {
    return next(err);
  }
};

// Display detail page for a specific Author.
exports.author_detail = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id }, "title summary").exec(),
    ]);
    const author = results[0];
    const authors_books = results[1];
    if (author == null) {
      const err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }
    res.render("author_detail", {
      title: "Author Detail",
      author: author,
      author_books: authors_books,
    });
  } catch (err) {
    return next(err);
  }
};

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
exports.author_create_post = [
  // Validate and sanitize the name field.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("author_form", {
        title: "Create Author",
        author: req.body,
        errors: errors.array(),
      });
      return;
    }
    // Data from form is valid.

    // Create an Author object with escaped and trimmed data.
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });
    author.save((err) => {
      if (err) {
        return next(err);
      }
      // Successful - redirect to new author record.
      res.redirect(author.url);
    });
  },
];

// Display Author delete form on GET.
exports.author_delete_get = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id }).exec(),
    ]);
    const author = results[0];
    const author_books = results[1];
    if (author == null) {
      // No results.
      res.redirect("/catalog/authors");
    }
    // Successful, so render.
    res.render("author_delete", {
      title: "Delete Author",
      author: author,
      author_books: author_books,
    });
  } catch (err) {
    next(err);
  }
};

// Handle Author delete on POST.
exports.author_delete_post = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Author.findById(req.body.authorid).exec(),
      Book.find({ author: req.body.authorid }).exec(),
    ]);
    const author = results[0];
    const authors_books = results[1];
    // Success
    if (authors_books.length > 0) {
      // Author has books. Render in same way as for GET route.
      res.render("author_delete", {
        title: "Delete Author",
        author: author,
        author_books: authors_books,
      });
      return;
    }
    // Author has no books. Delete object and redirect to the list of authors.
    await Author.findByIdAndRemove(req.body.authorid);
    // Success - go to author list
    res.redirect("/catalog/authors");
  } catch (err) {
    return next(err);
  }
};

// Display Author update form on GET.
exports.author_update_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Author update GET");
};

// Handle Author update on POST.
exports.author_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Author update POST");
};
