#!/usr/bin/env node

import {
  readFile,
  writeFile,
} from 'node:fs/promises';

import {stripIndent} from 'common-tags';
import {escapeUTF8} from 'entities';

/**
 * @constant
 * @type {string}
 * @default
 */
const GITHUB_REST_API = 'https://api.github.com';

/**
 * @param {string} endpoint
 * @param {object} data
 * @returns {Promise<object>}
 */
async function getResource(endpoint, data = {}) {
  const {GITHUB_TOKEN: accessToken} = process.env;

  if (!accessToken) {
    throw new Error('Unauthorized: Access token missing');
  }

  const params = new URLSearchParams(data);
  const url = new URL(`${endpoint}?${params}`, GITHUB_REST_API);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status !== 200) {
    throw new Error(`Request failed: tthe server responded with a status of ${response.status}`);
  }

  return await response.json();
}

/**
 * @generator
 * @param {string} endpoint
 * @param {object} data
 * @yields {object}
 */
async function* getCollection(endpoint, data = {}) {
  for (let page = 1; page < 1000; page++) {
    try {
      const items = await getResource(endpoint, {...data, page});

      if (items.length === 0) {
        return;
      }

      yield* items;
    } catch {
      return;
    }
  }
}

/**
 * @generator
 * @param {string} user
 * @yields {object}
 */
async function* getRepositories(user) {
  yield* getCollection(`/users/${user}/repos`, {
    sort: 'full_name',
    direction: 'asc',
  });
}

/**
 * @generator
 * @param {string} user
 * @param {string[]} topics
 * @yields {object}
 */
async function* getRepositoriesByTopic(user, topics) {
  for await (const repository of getRepositories(user)) {
    const hasIntersection = repository.topics.some((topic) => topics.includes(topic));

    if (! hasIntersection) {
      continue;
    }

    yield repository;
  }
}

/**
 * @param {string} user
 * @returns {Promise<string>}
 */
async function generateReadme(user) {
  const header = await readFile('resources/header.md', { encoding: 'utf-8' });
  const footer = await readFile('resources/footer.md', { encoding: 'utf-8' });

  const repositories = [];

  for await (const repository of getRepositoriesByTopic(user, ['custom-element', 'web-component'])) {
    repositories.push(stripIndent`
      ### [\`<${escapeUTF8(repository.name.replace(/-element$/, ''))}>\`](${repository.html_url})

      ${escapeUTF8(repository.description)}

      [Repository](${repository.html_url}) | [Demo](${repository.homepage})
    `);
  }

  return header + repositories.join('\n\n') + footer;
}

writeFile('README.md', await generateReadme('dweidner'));
