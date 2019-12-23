const express = require('express');
const app = express();
const fs = require('fs')
const perfomanse = require('./src/runer');

const port = 8000;
const countTest = 50; // количество тестов

(async function() { // выражение асинхронной функции в виде IIFE
  const inject = await readFile("static/inject.data");

  const js = eval(inject);
  const json = JSON.stringify(js);

  const resJSON = json;

  const resJS = `window._ = ${inject}`;
  const resInclude = `window._ = ${json}`;

  const header = await readFile("static/header.html");
  const footer = await readFile("static/footer.html");

  const html = {};

  html['resJS'] = `${header}<script>${resJS}</script>${footer}`;
  app.get('/resJS.html', function (req, res) {
    res.send(html['resJS']);
  });
  html['resInclude'] = `${header}<script>${resInclude}</script>${footer}`;
  app.get('/resInclude.html', function (req, res) {
    res.send(html['resInclude']);
  });

  //------------------------------------------------------------------------------------------//
  app.get('/resJS.js', function (req, res) {
    res.send(resJS);
  });
  html['js'] = `${header}<script src="/resJS.js"></script>${footer}`;
  app.get('/js.html', function (req, res) {
    res.send(html['resJS']);
  });
  //------------------------------------------------------------------------------------------//
  app.get('/resInclude.js', function (req, res) {
    res.send(resInclude);
  });
  html['innclude'] = `${header}<script src="/resInclude.js"></script>${footer}`;
  app.get('/innclude.html', function (req, res) {
    res.send(html['resInclude']);
  });
  //------------------------------------------------------------------------------------------//

  app.listen(port, async function () {
    const diffBytes = (Buffer.byteLength(inject, 'utf8') - Buffer.byteLength(json, 'utf8'))/1024;
    const diffPercent = 100*(Buffer.byteLength(inject, 'utf8') - Buffer.byteLength(json, 'utf8'))/Buffer.byteLength(inject, 'utf8');
    console.log(`run server to http://localhost:${port}`)
    console.log(`Потенциально можно уменьшить js на ${diffBytes}KB (${diffPercent}%)`)

    const parse = await perfomanse('http://localhost:8000/resJS.html', countTest)
    const innclude = await perfomanse('http://localhost:8000/resInclude.html', countTest)

    console.log("JSON.parse:", parse);
    console.log("innclude:", innclude)

    console.log(`METRIC DIFF`);

    const diff = {}
    for (const key in innclude) {
      if (parse.hasOwnProperty(key)) {
        const element = parse[key];
        diff[`diff: ${key}`] = innclude[key] - parse[key];
      }
    }
    console.log(diff)

  });
})()







async function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

// http://localhost:8000/resJS.html
// http://localhost:8000/resInclude.html

// http://localhost:8000/innclude.html
// http://localhost:8000/js.html