module.exports = async function windowPerfomanse(page) {
  // The values returned from evaluate() function should be JSON serializable.
  const rawMetrics = await page.evaluate(() =>  JSON.stringify(window.performance));
  const metrics = JSON.parse(rawMetrics);
  return metrics;
}