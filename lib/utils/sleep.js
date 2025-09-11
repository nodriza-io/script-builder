// Sleep utility: returns a Promise that resolves after ms milliseconds
module.exports = function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};
