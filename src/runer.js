const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const {URL} = require('url');
const {readFile, writeFile} = require('./helper/fs');
const windowPerfomanse = require('./helper/perfomanse');

/*
Дока на https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagemetrics

Timestamp The timestamp when the metrics sample was taken.
Documents Number of documents in the page.
Frames Number of frames in the page.
JSEventListeners Number of events in the page.
Nodes Number of DOM nodes in the page.
LayoutCount Total number of full or partial page layout.
RecalcStyleCount Total number of page style recalculations.
LayoutDuration Combined durations of all page layouts.
RecalcStyleDuration Combined duration of all page style recalculations.
ScriptDuration Combined duration of JavaScript execution.
TaskDuration Combined duration of all tasks performed by the browser.
JSHeapUsedSize Used JavaScript heap size.
JSHeapTotalSize Total JavaScript heap size.
*/


module.exports = async(url, count) => {
  const perfomanseArr = [];

  for (let i = 0; i < count; i++) {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
    });
    const page = await browser.newPage();
    await page._client.send('Performance.enable');
    await page.goto(url);

    const performance = await windowPerfomanse(page);
    const pageMetrics = await page.metrics();

    const _performanceMetrics =  await page._client.send('Performance.getMetrics');
    const performanceMetrics = _performanceMetrics.metrics.reduce((result, el) => {
      result[el.name] = el.value
      return result;
    },{})
    performanceMetrics.timing = performanceMetrics.DomContentLoaded - performanceMetrics.NavigationStart
    delete performanceMetrics.Timestamp;
    delete performanceMetrics.DomContentLoaded;
    delete performanceMetrics.NavigationStart;

    performanceMetrics.domContentLoadedEventEnd = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
    performanceMetrics.loadEventEnd = performance.timing.loadEventEnd - performance.timing.navigationStart;

    // performanceMetrics - Приоритетней, она более подробная
    perfomanseArr.push(performanceMetrics);
    await browser.close();
  }

  // // Тест для lighthouse
  // const {lhr} = await lighthouse(url, {
  //   port: (new URL(browser.wsEndpoint())).port,
  //   output: 'json',
  //   logLevel: 'info',
  // });

  const avg = {
    ScriptDuration:0,
    V8CompileDuration:0,
    TaskDuration:0,
    TaskOtherDuration:0,
    ThreadTime:0,
    JSHeapUsedSize:0,
    JSHeapTotalSize:0,
    timing:0,
    domContentLoadedEventEnd: 0,
    loadEventEnd: 0,
  }

  perfomanseArr.forEach((metrics) => {
    for (const key in avg) {
      if (metrics.hasOwnProperty(key)) avg[key] += metrics[key];
    }
  })

  for (const key in avg) {
    avg[key] = avg[key]/count;
  }

  return avg;
};