function status(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(new Error(response.statusText))
  }
}

function json(response) {
  console.log(response)
  return response.json()
}

function updateQuote(post) {
  let quoteTitle = document.getElementById('quote-title');
  let quoteContent = document.getElementById('quote-content');
  let quoteSource = document.getElementById('quote-source');

  quoteTitle.innerText = post.title;
  quoteContent.innerHTML = post.content;

  // If the Source is available, use it. Otherwise hide it.
  if (typeof post.custom_meta !== 'undefined' && typeof post.custom_meta.Source !== 'undefined') {
    quoteSource.innerHTML = 'Source:' + post.custom_meta.Source;
  } else {
    quoteSource.innerHTML = '';
  }
}

let URL = 'http://quotesondesign.com/wp-json/posts?filter[orderby]=rand&filter[posts_per_page]=1';

document.addEventListener("DOMContentLoaded", function () {
  fetch(URL)
    .then(status)
    .then(json)
    .then(function (data) {
      // The data is an array of posts
      updateQuote(data[0]);
    }).catch(function (error) {
      console.log('Request failed', error);
    });
});



