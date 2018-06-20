/* global fetch */
const TREEHERDER = 'https://treeherder.mozilla.org';
const PROJECT = 'mozilla-central';
const NINENTY_DAYS = '7776000';

const signaturesUrl = (project = PROJECT) => (
  `${TREEHERDER}/api/project/${project}/performance/signatures`
);

const subtests = async (signatureHash) => {
  const url = `${signaturesUrl()}/?parent_signature=${signatureHash}`;
  return (await fetch(url)).json();
};

const parentSignatureHash = async (suite, platform, option = 'pgo') => {
  const [options, signatures] = await Promise.all([
    await (await fetch(`${TREEHERDER}/api/optioncollectionhash/`)).json(),
    await (await fetch(`${signaturesUrl()}/?framework=1&platform=${platform}&subtests=0`)).json(),
  ]);

  // Create a structure with only jobs matching the suite, make option_collection_hash
  // be the key and track the signatureHash as a property
  const suites = Object.keys(signatures).reduce((res, signatureHash) => {
    const value = signatures[signatureHash];
    if (value.suite === suite) {
      res[value.option_collection_hash] = {
        parentSignatureHash: signatureHash,
        ...value,
      };
      return res;
    }
    return res;
  }, {});

  const result = [];
  // Remove from suites any suite that does not match the wanted 'option'
  options.forEach((elem) => {
    if (elem.option_collection_hash in suites) {
      // XXX: As far as I'm concerned I've always seen 1 element in this array
      if (elem.options[0].name === option) {
        result.push(suites[elem.option_collection_hash].parentSignatureHash);
      } else {
        delete suites[elem.option_collection_hash];
      }
    }
  });

  if (result.length !== 1) {
    throw Error('We should have an array of 1');
  }

  return result[0];
};

const subtestsSignatureUrl = (tests, project = PROJECT, interval = NINENTY_DAYS) => {
  // We probably want to get more data than just the ids (e.g. names, etc)
  const signatureIds = Object.values(tests).map(v => v.id);
  let baseDataUrl = `${TREEHERDER}/api/project/${project}/performance/data/?framework=1&interval=${interval}`;
  baseDataUrl += `&${signatureIds.map(id => `signature_id=${id}`).join('&')}`;
  return baseDataUrl;
};

const perherderGraphUrl = (signatureIds, platform, project = PROJECT, timerange = NINENTY_DAYS) => {
  let baseDataUrl = `${TREEHERDER}/perf.html#/graphs?timerange=${timerange}`;
  baseDataUrl += `&${signatureIds.map(id => `series=${project},${id},1,1`).join('&')}`;
  return baseDataUrl;
};

const subbenchmarksData = async ({ suite, platform }) => {
  const parentHash = await parentSignatureHash(suite, platform);
  const subtestsInfo = await subtests(parentHash);
  const signatureIds = Object.values(subtestsInfo).map(v => v.id);
  // This is a link to a Perfherder graph with all subtests
  const perfherderUrl = perherderGraphUrl(signatureIds);
  // The data contains an object where each key represents a subtest
  // Each data point of that subtest takes the form of:
  // {job_id: 162620134, signature_id: 1659462, id: 414057864, push_id: 306862, value: 54.89 }
  const dataPoints = await (
    await fetch(subtestsSignatureUrl(subtestsInfo))).json();

  const data = {};
  Object.keys(dataPoints).forEach((subtestHash) => {
    data[subtestHash] = {
      meta: {
        url: perherderGraphUrl([subtestHash]),
        ...subtestsInfo[subtestHash], // Original object from Perfherder
      },
      data: dataPoints[subtestHash].map(datum => ({
        ...datum,
        datetime: new Date(datum.push_timestamp * 1000),
      })),
    };
  });

  return { perfherderUrl, data };
};

export default subbenchmarksData;
