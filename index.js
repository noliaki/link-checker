const fs = require('fs');
const url = require('url');
const client = require('cheerio-httpcli');
const querystring = require('querystring');
const filename = 'result.txt';

const parseURL = url.parse(process.argv[2]);

// {
//   url: {
//     done: true,
//
//   }
// }
let linkList = {};

fs.writeFile(filename, new Date(), (err) => {
  // let uri = resolveURL(parseURL);
  addLink( resolveURL(url.parse(process.argv[2])).fairedURL )
  beginScraping();
  // Promise.all([client.fetch(uri.fairedURL, uri.query)])
  // .then(succsess, error);
});

function resolveURL(parseURL) {
  let auth = parseURL.auth? `${parseURL.auth}@` : '';
  let hash = parseURL.hash? `#${parseURL.hash}` : '';

  return {
    fairedURL: `${parseURL.protocol}//${auth}${parseURL.host}${parseURL.pathname}${hash}`,
    query: querystring.parse(parseURL.query)
  }
}

function addLink(url) {
  if(typeof linkList[url] === 'undefined') {
    linkList[url] = {
      url,
      done: false,
      ng_list: []
    };
  }
}

function beginScraping() {
  for (let item in linkList) {
    if (linkList.hasOwnProperty(item) && !item.done) {
      writeHeading(item.url)
      .then(() => {
        client.fetch(item.url, item.query)
        .then(done(item.url), error);
      });

      break;
    }
  }
}

function done(currentURL) {
  return function success(result) {
    if(Array.isArray(result)) {
      checkStatus(currentURL, result);
      return;
    }
    // console.log(Array.isArray(result));
    // console.log(result.response.statusCode, result.$);

    let promiseList = result.$('a').url({ invalid : false }).map((item) => {
      let parseURL = url.parse(item);
      let resolvedURL = resolveURL(parseURL);

      if(typeof linkList[resolvedURL.fairedURL] === 'undefined') {
        return client.fetch(resolvedURL.fairedURL, resolvedURL.query);
      }
      return null;
    });

    Promise.all(promiseList).then(done(result.response.request.uri.href), error);
  }
}


function error(error) {
  console.log('error: ' + error);
}

function writeHeading(url) {
  let heading = '\n\n\n//------------------------------//\n// ';
  heading += url;
  heading += '\n//\n';

  return new Promise((resolve, reject) => {
    fs.appendFile(filename, heading, (error) => {
      resolve();
    });
  });
}

function checkStatus(currentURL, result) {
  console.log('currentURL: ' + currentURL);

  let promises = [];
  for(let i = 0, len = result.length; i < len; i++){
    if( result[i].response.statusCode === 200 ) {
      addLink(result[i].response.request.uri.href);
    } else if (result[i].response.statusCode === 404) {
      promises.push(
        new Promise((resolve, reject) => {
          fs.appendFile(filename, result[i].response.request.uri.href, (error) => {
            resolve();
          });
        })
      );
    }
  }
}

function writeBody(result) {
  console.log( 'result: ', result );
  console.log( 'linkList: ', linkList );
  let promises = [];
  for(let i = 0, len = result.length; i < len; i++){
    if( result[i].response.statusCode === 200 ) {
      addLink(result[i].response.request.uri.href);
    } else if (result[i].response.statusCode === 404) {
      promises.push(
        new Promise((resolve, reject) => {
          fs.appendFile(filename, result[i].response.request.uri.href, (error) => {
            resolve();
          });
        })
      );
    }
  }
}
