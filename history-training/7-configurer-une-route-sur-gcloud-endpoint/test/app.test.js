const express = require('express');
const path = require('path');
const proxyquire = require('proxyquire').noCallThru();
const request = require('supertest');
const sinon = require('sinon');
const assert = require('assert');
const tools = require('@google-cloud/nodejs-repo-tools');

const SAMPLE_PATH = path.join(__dirname, '../app.js');

function getSample() {
  const testApp = express();
  sinon.stub(testApp, 'listen').callsArg(1);
  const expressMock = sinon.stub().returns(testApp);
  const app = proxyquire(SAMPLE_PATH, {
    express: expressMock,
  });

  return {
    app: app,
    mocks: {
      express: expressMock,
    },
  };
}

beforeEach(tools.stubConsole);
afterEach(tools.restoreConsole);

it(`sets up the sample`, done => {
  const sample = getSample();

  assert.ok(sample.mocks.express.calledOnce);
  done();
});

it(`should display a helloworld message`, async () => {
    const sample = getSample();
    await request(sample.app)
      .get('/hello')
      .expect(200)
      .expect(response => {
        assert.strictEqual(response.body, 'Hello, world!');
      });
  });