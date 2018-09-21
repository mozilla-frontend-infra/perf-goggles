/* global describe it */
import fetchMock from 'fetch-mock';
import {
  fetchBenchmarkData,
  perfDataUrls,
  signaturesUrl,
  subbenchmarksData,
  TREEHERDER,
} from '../src';
import MAC_STYLEBENCH_SIGNATURES from './mocks/mac/StyleBench/signatures';
import MAC_STYLEBENCH_URLS from './mocks/mac/StyleBench/urls';

const assert = require('assert');
const LINUX64_SIGNATURES = require('./mocks/linux64/signaturesNoSubtests');
const LINUX64_JETSTREAM_DATA = require('./mocks/linux64/JetStream/data');
const LINUX64_JETSTREAM_SUBTESTS = require('./mocks/linux64/JetStream/subtests');
const LINUX64_JETSTREAM_EXPECTED_DATA = require('./mocks/linux64/JetStream/expected');
const WIN7_SIGNATURES = require('./mocks/win7/signaturesNoSubtests');
const WIN7_MMA_DATA = require('./mocks/win7/MotionMarkAnimometer/data');
const WIN7_MMA_EXPECTED_DATA = require('./mocks/win7/MotionMarkAnimometer/expected');
const WIN10_SIGNATURES = require('./mocks/win10/signaturesNoSubtests');
const WIN10_MMA_SUBTESTS = require('./mocks/win10/MotionMarkAnimometer/subtests');
const WIN10_MMA_DATA = require('./mocks/win10/MotionMarkAnimometer/data');
const WIN10_MMA_EXPECTED_DATA = require('./mocks/win10/MotionMarkAnimometer/expected');
const OPTION_COLLECTION_HASHES = require('./mocks/optionCollectionHash');

const PROJECT = 'mozilla-central';
const TIMERANGE = 3 * 24 * 3600;

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
  const seriesConfig = {
    extraOptions: ['e10s', 'stylo'],
    frameworkId: 1,
    option: 'pgo',
    platform: 'linux64',
    project: PROJECT,
    suite: 'JetStream',
  };

  describe('Linux64', () => {
    const { frameworkId, platform, project } = seriesConfig;
    fetchMock.get(
      `${signaturesUrl(project)}?framework=${frameworkId}&platform=${platform}&subtests=0`,
      LINUX64_SIGNATURES,
    );
    describe('Jetstream', () => {
      const { extraOptions, option, suite } = seriesConfig;
      const signatureIds = [
        1661255, 1661256, 1661257, 1661258, 1661259, 1661260, 1661261, 1661262, 1661263, 1661264,
        1661265, 1661266, 1661267, 1661268, 1661269, 1661270, 1661271, 1661272, 1661273, 1661274,
        1661275, 1661276, 1661277, 1661278, 1661279, 1661280, 1661281, 1661282, 1661283, 1661284,
        1661285, 1661286, 1661287, 1661288, 1661289, 1661290, 1661291, 1661292, 1661293, 1661294,
      ];
      const parentSignatureHash = '46ca6eb015193051661117a30bd39e6f25ee4744';

      fetchMock.get(
        `${signaturesUrl(project)}?parent_signature=${parentSignatureHash}`,
        LINUX64_JETSTREAM_SUBTESTS,
      );

      fetchMock.get(
        perfDataUrls(seriesConfig, signatureIds, TIMERANGE)[0],
        LINUX64_JETSTREAM_DATA,
      );

      it('should find Linux64 JetStream pgo subtests data', async () => {
        const data =
          await subbenchmarksData(frameworkId, platform, suite, option, extraOptions, TIMERANGE);
        const modifiedExpectedData = downcastDatetimesToStrings(LINUX64_JETSTREAM_EXPECTED_DATA);
        assert.deepEqual(data, modifiedExpectedData);
      });
    });
  });
});

describe('Raptor', () => {
  const seriesConfig = {
    frameworkId: 10,
    option: 'pgo',
    project: PROJECT,
  };
  const { frameworkId, option, project } = seriesConfig;

  describe('Windows 10', () => {
    const platform = 'windows10-64';
    fetchMock.get(`${signaturesUrl(project)}?framework=${frameworkId}&platform=${platform}&subtests=0`, WIN10_SIGNATURES);

    describe('MotionMarkAnimometer', () => {
      const suite = 'raptor-motionmark-animometer-firefox';
      const signatureIds = [
        1708520, 1708521, 1708522, 1708523, 1708524, 1708525, 1708526, 1708527, 1708528,
      ];
      const parentHash = '9ad671fb568a5b3027af35b5d42fc6dd385f25ed';
      fetchMock.get(`${signaturesUrl(project)}?parent_signature=${parentHash}`, WIN10_MMA_SUBTESTS);
      fetchMock.get(perfDataUrls(seriesConfig, signatureIds, TIMERANGE)[0], WIN10_MMA_DATA);

      it('should find Windows 10 MotionMarkAnimometer pgo subtests data', async () => {
        const data = await subbenchmarksData(frameworkId, platform, suite, option, [], TIMERANGE);
        const modifiedExpectedData = downcastDatetimesToStrings(WIN10_MMA_EXPECTED_DATA);
        assert.deepEqual(data, modifiedExpectedData);
      });
    });
  });

  describe('Mac OS X', () => {
    describe('StyleBench', () => {
      const signatureIds = MAC_STYLEBENCH_SIGNATURES;

      it('the perfDataUrls should match', async () => {
        const urls = perfDataUrls(seriesConfig, signatureIds, 14 * 24 * 3600);
        assert.deepEqual(urls, MAC_STYLEBENCH_URLS);
      });
    });
  });

  describe('Windows 7 32-bit', () => {
    const platform = 'windows7-32';
    fetchMock.get(`${signaturesUrl(project)}?framework=${frameworkId}&platform=${platform}&subtests=0`, WIN7_SIGNATURES);

    describe('MotionMarkAnimometer main score', () => {
      const suite = 'raptor-motionmark-animometer-firefox';

      fetchMock.get(perfDataUrls(seriesConfig, ['1713376'], TIMERANGE)[0], WIN7_MMA_DATA);

      it('The benchmark data should match', async () => {
        const data = await fetchBenchmarkData(frameworkId, platform, suite, 'opt', [], TIMERANGE);
        assert.deepEqual(data, downcastDatetimesToStrings(WIN7_MMA_EXPECTED_DATA));
      });
    });
  });
});
