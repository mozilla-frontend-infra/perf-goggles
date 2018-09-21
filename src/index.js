import 'isomorphic-fetch';
import isEqual from 'lodash.isequal';
import { stringify } from 'query-string';

export const TREEHERDER = 'https://treeherder.mozilla.org';
const PROJECT = 'mozilla-central';
const DEFAULT_TIMERANGE = 14 * 24 * 3600;

export const signaturesUrl = (project = PROJECT) => (
  `${TREEHERDER}/api/project/${project}/performance/signatures/`
);

const dataPointsEndpointUrl = (project = PROJECT) => (
  `${TREEHERDER}/api/project/${project}/performance/data/`
);

const platformSuitesUrl = ({ frameworkId, platform, project }) => (
  `${signaturesUrl(project)}?framework=${frameworkId}&platform=${platform}&subtests=0`
);

export const perfDataUrls =
  ({ frameworkId, project }, signatureIds, timerange) => {
    const url = dataPointsEndpointUrl(project);
    const baseParams = stringify({
      framework: frameworkId,
      interval: timerange,
    });
    const urls = [];
    for (let i = 0; i < (signatureIds.length) / 100; i += 1) {
      const signaturesParams = stringify({
        signature_id: signatureIds.slice(i * 100, ((i + 1) * 100)),
      });
      urls.push(`${url}?${baseParams}&${signaturesParams}`);
    }
    return urls;
  };

const tranformData = data =>
  data.map(datum => ({
    datetime: new Date(datum.push_timestamp * 1000),
    ...datum,
  }));

// The data contains an object where each key represents a subtest
// Each data point of that subtest takes the form of:
// {job_id: 162620134, signature_id: 1659462, id: 414057864, push_id: 306862, value: 54.89 }
const fetchPerfData = async (seriesConfig, signatureIds, timerange) => {
  const dataPoints = {};
  await Promise.all(perfDataUrls(seriesConfig, signatureIds, timerange)
    .map(async (url) => {
      const data = await (await fetch(url)).json();
      Object.keys(data).forEach((hash) => {
        if (!dataPoints[hash]) {
          dataPoints[hash] = [];
        }
        dataPoints[hash] = dataPoints[hash].concat(tranformData(data[hash]));
      });
    }));
  return dataPoints;
};

const perherderGraphUrl =
  ({ project, frameworkId }, signatureIds, timerange = DEFAULT_TIMERANGE) => {
    let baseDataUrl = `${TREEHERDER}/perf.html#/graphs?timerange=${timerange}`;
    baseDataUrl += `&${signatureIds.sort().map(id =>
      `series=${project},${id},1,${frameworkId}`).join('&')}`;
    return baseDataUrl;
  };

const queryAllTreeherderOptions = async () => {
  const response = await fetch(`${TREEHERDER}/api/optioncollectionhash/`);
  return response.json();
};

const transformOptionCollectionHash = (optionCollectionHash) => {
  const options = {};
  optionCollectionHash.forEach((optionCollection) => {
    // What optionCollection looks like:
    // {"options":[{"name":"debug"},{"name":"memleak"}],
    //  "option_collection_hash":"531e7f974f8dab5d4d8dfe344a0219a5b1184d20"},
    // and we wanted "options" to look like this instead:
    // "options":["debug", "memleak"]
    options[optionCollection.option_collection_hash] =
      optionCollection.options.map(keys => keys.name);
  });
  return options;
};

const treeherderOptions = async () => {
  const optionCollectionHash = await queryAllTreeherderOptions();
  return transformOptionCollectionHash(optionCollectionHash);
};

const queryPlatformSignatures = async (seriesConfig) => {
  const response = await fetch(platformSuitesUrl(seriesConfig));
  return response.json();
};

const querySubtests = async ({ project }, parentHash) => {
  const response = await fetch(`${signaturesUrl(project)}?parent_signature=${parentHash}`);
  return response.json();
};

const signaturesForPlatformSuite = async (seriesConfig) => {
  const allPlatformSignatures = await queryPlatformSignatures(seriesConfig);
  const filteredSignatures = Object.keys(allPlatformSignatures)
    .reduce((res, signatureHash) => {
      const jobSignature = allPlatformSignatures[signatureHash];
      // Jobs that have a .test property are subtests; This is due to polluted data.
      // For instance raptor-tp6-amazon-firefox would show an extra entry
      // with test === 'raptor-tp6-amazon-firefox-fnbpaint'
      if (jobSignature.suite !== seriesConfig.suite || jobSignature.test) {
        return res;
      }
      res[signatureHash] = {
        parentSignatureHash: signatureHash,
        ...jobSignature,
      };
      return res;
    }, {});
  return filteredSignatures;
};

const findParentSignatureInfo = ({ option = 'pgo', extraOptions }, signatures, options) => {
  const result = [];
  Object.keys(signatures).forEach((hash) => {
    const signature = signatures[hash];
    const optionCollection = options[signature.option_collection_hash];
    if (optionCollection && optionCollection.includes(option)) {
      if (extraOptions && extraOptions.length > 0) {
        if (isEqual(signature.extra_options, extraOptions)) {
          result.push(signature);
        }
      } else {
        result.push(signature);
      }
    }
  });

  if (result.length !== 1) {
    return undefined;
  }

  return result[0];
};

const parentSignatureInfo = async (seriesConfig) => {
  const [signatures, options] = await Promise.all([
    signaturesForPlatformSuite(seriesConfig),
    treeherderOptions(seriesConfig.project),
  ]);
  return findParentSignatureInfo(seriesConfig, signatures, options);
};

const prepareData = async (seriesConfig, subtestsInfo, timerange) => {
  const signatureIds = Object.values(subtestsInfo).map(v => v.id);
  const data = {
    // Link to Perfherder with all subtests
    perfherderUrl: perherderGraphUrl(seriesConfig, signatureIds),
    data: {},
  };
  const dataPoints = await fetchPerfData(seriesConfig, signatureIds, timerange);

  Object.keys(dataPoints).forEach((subtestHash) => {
    data.data[subtestHash] = {
      data: dataPoints[subtestHash],
      meta: {
        url: perherderGraphUrl(seriesConfig, [subtestHash]),
        ...subtestsInfo[subtestHash], // Original object from Perfherder
      },
    };
  });

  return data;
};

export const subbenchmarksData = async (
  frameworkId, platform, suite, option, extraOptions, timerange = DEFAULT_TIMERANGE,
) => {
  const seriesConfig = {
    frameworkId,
    platform,
    suite,
    option,
    extraOptions,
    project: PROJECT, // XXX: For now
  };
  const parentInfo = await parentSignatureInfo(seriesConfig);
  if (!parentInfo) {
    return {};
  }
  const subtests = await querySubtests(seriesConfig, parentInfo.parentSignatureHash);
  return prepareData(seriesConfig, subtests, timerange);
};

export const fetchBenchmarkData = async (
  frameworkId, platform, suite, option, extraOptions, timerange = DEFAULT_TIMERANGE,
) => {
  const seriesConfig = {
    frameworkId,
    platform,
    suite,
    option,
    extraOptions,
    project: PROJECT, // XXX: For now
  };
  const parentInfo = await parentSignatureInfo(seriesConfig);
  if (!parentInfo) {
    return {};
  }
  const perfherderUrl = perherderGraphUrl(seriesConfig, [parentInfo.id]);
  // Each data point takes the form of:
  // {job_id: 162620134, signature_id: 1659462, id: 414057864, push_id: 306862, value: 54.89 }
  const dataPoints = await fetchPerfData(seriesConfig, [parentInfo.id], timerange);
  // This data structure is to resemble the one used by subbenchmarks
  return {
    data: {
      [parentInfo.parentSignatureHash]: {
        data: dataPoints[parentInfo.parentSignatureHash],
        meta: {
          url: perfherderUrl,
          ...parentInfo,
        },
      },
    },
    perfherderUrl,
  };
};
