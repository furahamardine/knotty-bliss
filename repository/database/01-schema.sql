CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  title TEXT NOT NULL CHECK(length(trim(title)) > 0),
  author TEXT NOT NULL CHECK(length(trim(author)) > 0),
  genre TEXT NOT NULL CHECK(length(trim(genre)) > 0),
  price_rwf INTEGER NOT NULL CHECK(typeof(price_rwf)='integer' AND price_rwf >= 0),
  quantity INTEGER NOT NULL CHECK(typeof(quantity)='integer' AND quantity >= 0),
  preorder TEXT NOT NULL CHECK(preorder IN ('yes','no')),
  cover TEXT NOT NULL DEFAULT ''
);
