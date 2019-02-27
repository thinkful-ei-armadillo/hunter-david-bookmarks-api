INSERT INTO bookmarks (id, title, url, description, rating)
VALUES
  (1, 'Title1', 'http://www.url.com', 'lorem ipsum', 0),
  (2, 'Title2', 'http://www.url.com', 'lorem ipsum', 0),
  (3, 'Title3', 'http://www.url.com', 'lorem ipsum', 0);

--    psql -U dunder_mifflin -d bookmarks -f ./seeds/seed.bookmarks.sql