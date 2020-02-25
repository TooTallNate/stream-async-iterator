import { Readable } from 'stream';
import createDebug from 'debug';
import once from '@tootallnate/once';

const debug = createDebug('stream-async-iterator');

function createAsyncIterator(stream: Readable) {
	let bufferPromise: Promise<Buffer> | null = null;
	const it = asyncIterator(stream) as createAsyncIterator.StreamAsyncIterator;
	it.then = (resolve, reject) => {
		if (!bufferPromise) {
			bufferPromise = buffer(it);
		}
		return bufferPromise.then(resolve, reject);
	};
	return it;
}

async function buffer(
	it: createAsyncIterator.StreamAsyncIterator
): Promise<Buffer> {
	let bytes = 0;
	let buffers: Buffer[] = [];
	for await (const b of it) {
		bytes += b.length;
		buffers.push(b);
		debug('Buffered %o buffers, %o bytes', buffers.length, bytes);
	}
	return Buffer.concat(buffers, bytes);
}

async function* asyncIterator(stream: Readable) {
	let ended = false;
	const endPromise = once(stream, 'end').then(() => {
		debug('Got "end" event');
		ended = true;
	});
	while (!ended) {
		const value = stream.read();
		if (value === null) {
			debug('Waiting for "readable" or "end"');
			await Promise.race([once(stream, 'readable'), endPromise]);
		} else {
			yield value;
		}
	}
}

namespace createAsyncIterator {
	export interface StreamAsyncIterator
		extends AsyncGenerator<Buffer, void, void>,
			PromiseLike<Buffer> {}
}

export = createAsyncIterator;
