/* global describe it */
import fetchMock from 'fetch-mock';
import {
  parentSignatureHash,
  signaturesUrl,
  subtestsPerfDataUrl,
  subbenchmarksData,
  TREEHERDER,
} from '../src';

const assert = require('assert');
const LINUX64_SIGNATURES = require('./mocks/linux64/signaturesNoSubtests');
const LINUX64_JETSTREAM_DATA = require('./mocks/linux64/JetStream/data');
const LINUX64_JETSTREAM_SUBTESTS = require('./mocks/linux64/JetStream/subtests');
const LINUX64_JETSTREAM_EXPECTED_DATA = require('./mocks/linux64/JetStream/expected');
const WIN10_SIGNATURES = require('./mocks/win10/signaturesNoSubtests');
const WIN10_MMA_SUBTESTS = require('./mocks/win10/MotionMarkAnimometer/subtests');
const WIN10_MMA_DATA = require('./mocks/win10/MotionMarkAnimometer/data');
const WIN10_MMA_EXPECTED_DATA = require('./mocks/win10/MotionMarkAnimometer/expected');
const OPTION_COLLECTION_HASHES = require('./mocks/optionCollectionHash');

const downcastDatetimesToStrings = (data) => {
  const newData = Object.assign({}, data);
  Object.keys(newData.data).forEach((node) => {
    newData.data[node].data.forEach((datum, index) => {
      newData.data[node].data[index].datetime = new Date(datum.push_timestamp * 1000);
    });
  });
  return newData;
};

fetchMock.get(`${TREEHERDER}/api/optioncollectionhash/`, OPTION_COLLECTION_HASHES);

describe('Talos', () => {
  const frameworkId = 1;

  describe('Linux64', () => {
    const platform = 'linux64';
    const extraOptions = ['e10s', 'stylo'];
    fetchMock.get(`${signaturesUrl()}?framework=${frameworkId}&platform=${platform}&subtests=0`, LINUX64_SIGNATURES);

    describe('Jetstream', () => {
      const signatureIds = [
        1661255, 1661256, 1661257, 1661258, 1661259, 1661260, 1661261, 1661262, 1661263, 1661264,
        1661265, 1661266, 1661267, 1661268, 1661269, 1661270, 1661271, 1661272, 1661273, 1661274,
        1661275, 1661276, 1661277, 1661278, 1661279, 1661280, 1661281, 1661282, 1661283, 1661284,
        1661285, 1661286, 1661287, 1661288, 1661289, 1661290, 1661291, 1661292, 1661293, 1661294,
      ];
      const parentHash = '46ca6eb015193051661117a30bd39e6f25ee4744';
      fetchMock.get(`${signaturesUrl()}?parent_signature=${parentHash}`, LINUX64_JETSTREAM_SUBTESTS);
      fetchMock.get(subtestsPerfDataUrl(frameworkId, signatureIds), LINUX64_JETSTREAM_DATA);

      it('should find Linux64 JetStream pgo signature hash', async () => {
        const signature = await parentSignatureHash(frameworkId, platform, 'JetStream', 'pgo', extraOptions);
        assert.equal(signature, '46ca6eb015193051661117a30bd39e6f25ee4744');
      });

      it('should find Linux64 JetStream opt signature hash', async () => {
        const signature = await parentSignatureHash(frameworkId, platform, 'JetStream', 'opt', extraOptions);
        assert.equal(signature, '4e714a801f334b874de0aeda22df6a21b8f40500');
      });

      it('should not find Linux64 JetStream debug signature hash', async () => {
        const signature = await parentSignatureHash(frameworkId, platform, 'JetStream', 'debug', extraOptions);
        assert.equal(signature, undefined);
      });

      it('should find Linux64 JetStream pgo subtests data', async () => {
        const data = await subbenchmarksData(frameworkId, platform, 'JetStream', 'pgo', extraOptions);
        const modifiedExpectedData = downcastDatetimesToStrings(LINUX64_JETSTREAM_EXPECTED_DATA);
        assert.deepEqual(data, modifiedExpectedData);
      });
    });
  });
});

describe('Raptor', () => {
  const frameworkId = 10;

  describe('Windows 10', () => {
    const platform = 'windows10-64';
    fetchMock.get(`${signaturesUrl()}?framework=${frameworkId}&platform=${platform}&subtests=0`, WIN10_SIGNATURES);

    describe('MotionMarkAnimometer', () => {
      const signatureIds = [
        1708520, 1708521, 1708522, 1708523, 1708524, 1708525, 1708526, 1708527, 1708528,
      ];
      const parentHash = '9ad671fb568a5b3027af35b5d42fc6dd385f25ed';
      fetchMock.get(`${signaturesUrl()}?parent_signature=${parentHash}`, WIN10_MMA_SUBTESTS);
      fetchMock.get(subtestsPerfDataUrl(frameworkId, signatureIds), WIN10_MMA_DATA);

      it('should find Windows 10 MotionMarkAnimometer pgo subtests data', async () => {
        const data = await subbenchmarksData(frameworkId, platform, 'raptor-motionmark-animometer-firefox', 'pgo');
        const modifiedExpectedData = downcastDatetimesToStrings(WIN10_MMA_EXPECTED_DATA);
        assert.deepEqual(data, modifiedExpectedData);
      });
    });
  });
});
