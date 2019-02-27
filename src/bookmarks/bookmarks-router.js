'use strict';

const express = require('express');
const BookmarksService = require('./bookmarks-service');

const bookmarksRouter = express.Router();
const jsonParser = express.json();
const xss = require('xss');

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title), // sanitize title
  url: xss(bookmark.url), // sanitize url
  description: xss(bookmark.description), // sanitize content
  rating: Number(bookmark.rating),
});

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { id, title, url, description, rating } = req.body;
    const newBookmark = { id, title, url, description, rating };
    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }
    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(serializeBookmark(bookmark));      
      })
      .catch(error => {console.log(`HERE IS THE MESSAGE: ${error}`); next();});
  });

bookmarksRouter
  .route('/:bookmark_id')
  .all((req, res, next) => {
    BookmarksService.getById(
      req.app.get('db'),
      req.params.bookmark_id
    )
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: 'Bookmark doesn\'t exist' }
          });
        }
        res.bookmark = bookmark; // save the bookmark for the next middleware
        next(); // don't forget to call next so the next middleware happens!
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeBookmark(res.bookmark));
    // const knexInstance = req.app.get('db');
    // BookmarksService.getById(knexInstance, req.params.bookmark_id)
    //   .then(bookmark => {
    //     if (!bookmark) {
    //       return res.status(404).json({
    //         error: { message: 'Bookmark doesn\'t exist' }
    //       });
    //     }
    //     res.json(serializeBookmark(bookmark));
    //   })
    //   .catch(next);
  })
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      req.params.bookmark_id
    )
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;