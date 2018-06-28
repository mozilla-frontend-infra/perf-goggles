/* global describe it */
import fetchMock from 'fetch-mock';
import {
  parentSignatureHash,
  signaturesUrl,
  subtestsPerfDataUrl,
  subbenchmarksData,
  TREEHERDER,
} from '../../src/utils/perfherder';

const assert = require('assert');
const LINUX64_SIGNATURES = require('../mocks/linux64SignaturesNoSubtests');
const LINUX64_JETSTREAM_SUBTESTS = require('../mocks/linux64JetStreamSubtests');
const LINUX64_JETSTREAM_DATA = require('../mocks/linux64JetStreamData');
const LINUX64_JETSTREAM_EXPECTED_DATA = require('../expected/linux64JetStreamExpectedData');
const LINUX64_DROMAEO_DOM_SUBTESTS = require('../mocks/linux64DromaeoDomSubtests');
const LINUX64_DROMAEO_DOM_DATA = require('../mocks/linux64DromaeoDomData');
const LINUX64_DROMAEO_DOM_EXPECTED_DATA = require('../expected/linux64DromaeoDomExpectedData');
const OPTION_COLLECTION_HASHES = require('../mocks/optionCollectionHash');

const downcastDatetimesToStrings = (data) => {
  const newData = Object.assign({}, data);
  Object.keys(newData.data).forEach((node) => {
    newData.data[node].data.forEach((datum, index) => {
      newData.data[node].data[index].datetime = new Date(datum.push_timestamp * 1000);
    });
  });
  return newData;
};

describe('Linux64 data', () => {
  const platform = 'linux64';
  const extraOptions = ['e10s', 'stylo'];
  fetchMock.get(`${signaturesUrl()}?framework=1&platform=${platform}&subtests=0`, LINUX64_SIGNATURES);
  fetchMock.get(`${TREEHERDER}/api/optioncollectionhash/`, OPTION_COLLECTION_HASHES);

  describe('Linux64 Jetstream data', () => {
    const signatureIds = [
      1661255, 1661256, 1661257, 1661258, 1661259, 1661260, 1661261, 1661262, 1661263, 1661264,
      1661265, 1661266, 1661267, 1661268, 1661269, 1661270, 1661271, 1661272, 1661273, 1661274,
      1661275, 1661276, 1661277, 1661278, 1661279, 1661280, 1661281, 1661282, 1661283, 1661284,
      1661285, 1661286, 1661287, 1661288, 1661289, 1661290, 1661291, 1661292, 1661293, 1661294,
    ];
    const parentHash = '46ca6eb015193051661117a30bd39e6f25ee4744';
    fetchMock.get(`${signaturesUrl()}?parent_signature=${parentHash}`, LINUX64_JETSTREAM_SUBTESTS);
    fetchMock.get(subtestsPerfDataUrl(signatureIds), LINUX64_JETSTREAM_DATA);

    it('should find Linux64 JetStream pgo signature hash', async () => {
      const signature = await parentSignatureHash(platform, 'JetStream', 'pgo', extraOptions);
      assert.equal(signature, '46ca6eb015193051661117a30bd39e6f25ee4744');
    });

    it('should find Linux64 JetStream opt signature hash', async () => {
      const signature = await parentSignatureHash(platform, 'JetStream', 'opt', extraOptions);
      assert.equal(signature, '4e714a801f334b874de0aeda22df6a21b8f40500');
    });

    it('should not find Linux64 JetStream debug signature hash', async () => {
      const signature = await parentSignatureHash(platform, 'JetStream', 'debug', extraOptions);
      assert.equal(signature, undefined);
    });

    it('should find Linux64 JetStream pgo subtests data', async () => {
      const data = await subbenchmarksData(platform, 'JetStream', 'pgo', extraOptions);
      const modifiedExpectedData = downcastDatetimesToStrings(LINUX64_JETSTREAM_EXPECTED_DATA);
      assert.deepEqual(data, modifiedExpectedData);
    });
  });

  describe('Linux64 DromaeoDom data', () => {
    const signatureIds = [1651446, 1651447, 1651448, 1651449];
    const parentHash = '947870e091eef0257755ce0e6fd6302e1704c15b';
    fetchMock.get(`${signaturesUrl()}?parent_signature=${parentHash}`, LINUX64_DROMAEO_DOM_SUBTESTS);
    fetchMock.get(subtestsPerfDataUrl(signatureIds), LINUX64_DROMAEO_DOM_DATA);

    it('should find Linux64 Dromaeo DOM pgo subtests data', async () => {
      const data = await subbenchmarksData(platform, 'dromaeo_dom', 'pgo', extraOptions);
      const modifiedExpectedData = downcastDatetimesToStrings(LINUX64_DROMAEO_DOM_EXPECTED_DATA);
      assert.deepEqual(data, modifiedExpectedData);
    });
  });
});
