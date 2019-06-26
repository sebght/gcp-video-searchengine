const assert = require('assert');
const uuid = require('uuid');
const utils = require('@google-cloud/nodejs-repo-tools');

const {getRecording} = require('..');

beforeEach(utils.stubConsole);
afterEach(utils.restoreConsole);

it('getRecording: should print uploaded message', async () => {
  // Initialize mocks
  const filename = uuid.v4();
  const event = {
    name: filename,
    resourceState: 'exists',
    metageneration: '1',
  };

  // Call tested function and verify its behavior
  await getRecording(event);
  assert.strictEqual(
    console.log.calledWith(`File ${filename} uploaded.`),
    true
  );
});

it('getRecording: should print metadata updated message', async () => {
  // Initialize mocks
  const filename = uuid.v4();
  const event = {
    name: filename,
    resourceState: 'exists',
    metageneration: '2',
  };

  // Call tested function and verify its behavior
  await getRecording(event);
  assert.strictEqual(
    console.log.calledWith(`File ${filename} metadata updated.`),
    true
  );
});

it('getRecording: should print deleted message', async () => {
  // Initialize mocks
  const filename = uuid.v4();
  const event = {
    name: filename,
    resourceState: 'not_exists',
    metageneration: '3',
  };

  // Call tested function and verify its behavior
  await getRecording(event);
  assert.strictEqual(console.log.calledWith(`File ${filename} deleted.`), true);
});