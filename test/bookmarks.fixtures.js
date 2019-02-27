'use strict';

function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'title1',
      url: 'http://www.url.com',
      description: 'How-to',
      rating: 0
    },
    {
      id: 2,
      title: 'title2',
      url: 'http://www.url.com',
      description: 'How-to',
      rating: 0      
    },
    {
      id: 3,
      title: 'title3',
      url: 'http://www.url.com',
      description: 'How-to',
      rating: 0      
    }
  ];
}

module.exports = {
  makeBookmarksArray,
};