'use strict';

const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe('Bookmarks Endpoints', () => {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

  context('Given no bookmarks', () => {
    it('responds with 404', () => {
      const bookmarkId = 123456;
      return supertest(app)
        .get(`/bookmarks/${bookmarkId}`)
        .expect(404, { error: { message: 'Bookmark doesn\'t exist' } });
    });
  });
  
  context('Given no bookmarks', () => {
    it('responds with 200 and an empty list', () => {
      return supertest(app)
        .get('/bookmarks')
        .expect(200, []);
    });
  });

  describe('POST /bookmarks', () => {
    it('creates an bookmark, responding with 201 and the new bookmark',  function() {
      const newBookmark = {
        id: 4,
        title: 'Title4',
        url: 'http://www.url.com',
        description: 'lorem ipsum',
        rating: 5
      };
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .expect(res => {
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
        })
        .then(postRes =>
          supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        );
    });
    const requiredFields = ['title', 'url'];

    requiredFields.forEach(field => {
      const newBookmark = {
        id: 5,
        title: 'Test new bookmark',
        url: 'http://www.url.com',
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field];

        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          });
      });
    });
    describe('DELETE /bookmarks/:bookmark_id', () => {
      context('Given no bookmarks', () => {
        it('responds with 404', () => {
          const bookmarkId = 123456;
          return supertest(app)
            .delete(`/bookmark/${bookmarkId}`)
            .expect(404, { error: { message: 'Bookmark doesn\'t exist' } });
        });
      });
      context('Given there are bookmarks in the database', () => {
        const testBookmarks = makeBookmarksArray();
      
        beforeEach('insert bookmarks', () => {
          return db
            .into('bookmarks')
            .insert(testBookmarks);
        });
      
        it('responds with 204 and removes the bookmarks', () => {
          const idToRemove = 2;
          const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
          return supertest(app)
            .delete(`/bookmarks/${idToRemove}`)
            .expect(204)
            .then(res =>
              supertest(app)
                .get('/bookmarks')
                .expect(expectedBookmarks)
            );
        });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
    
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, testBookmarks);
      });

      it('GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(200, expectedBookmark);
      });

      context('Given an XSS attack bookmark', () => {
        const maliciousBookmark = {
          id: 911,
          title: 'Naughty naughty very naughty <script>alert("xss");</script>',
          url: 'http://www.url.com',
          description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.'
        };
      
        beforeEach('insert malicious bookmark', () => {
          return db
            .into('bookmarks')
            .insert([ maliciousBookmark ]);
        });
      
        it('removes XSS attack content', () => {
          return supertest(app)
            .get(`/bookmarks/${maliciousBookmark.id}`)
            .expect(200)
            .expect(res => {
              expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
              expect(res.body.url).to.eql('http://www.url.com');
              expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
            });
        });

        it('removes XSS attack content', () => {
          return supertest(app)
            .get('/bookmarks')
            .expect(200)
            .expect(res => {
              expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
              expect(res.body.url).to.eql('http://www.url.com');
              expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
            });
        });
        it('removes XSS attack content', () => {
          return supertest(app)
            .post(`/bookmarks/${maliciousBookmark.id}`)
            .expect(200)
            .expect(res => {
              expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
              expect(res.body.url).to.eql('http://www.url.com');
              expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
            });
        });
      });

    });
  }); 
});