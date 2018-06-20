const once = require('event-to-promise');
const debug = require('debug')('stream-async-iterator');

module.exports = function createAsyncIterator(stream) {
  let ended = false;

  function onEnd() {
    debug('"end" event');
    ended = true;
  }

  async function next() {
    const value = stream.read();
    if (value === null && !ended) {
      debug('waiting for "readable" or "end"');
      await Promise.race([
        once(stream, 'readable'),
        endPromise
      ]);
      return next();
    }
    const done = value === null && ended;
    return { done, value };
  }

  const endPromise = once(stream, 'end');
  endPromise.then(onEnd);

  const it = { next };
  if (Symbol.asyncIterator) {
    it[Symbol.asyncIterator] = () => it;
  }
  return it;
}
