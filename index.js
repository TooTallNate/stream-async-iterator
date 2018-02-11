const once = require('event-to-promise');

module.exports = function createAsyncIterator(stream) {
  let readable = false;

  function onReadable() {
    readable = true;
  }

  async function next() {
    if (!readable) {
      await once(stream, 'readable');
    }
    const value = stream.read();
    readable = false;
    const done = value === null;
    return { done, value };
  }

  stream.on('readable', onReadable);

  return {
    next
  };
}
