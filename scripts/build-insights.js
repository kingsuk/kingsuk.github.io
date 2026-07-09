#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var DATA_FILE = path.join(ROOT, 'data', 'insights.json');
var INDEX_FILE = path.join(ROOT, 'index.html');
var AUTHOR_ID = 'https://kingsuk.github.io/#person';
var GRID_BEGIN = '<!-- INSIGHTS:GRID:BEGIN -->';
var GRID_END = '<!-- INSIGHTS:GRID:END -->';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadInsights() {
  var raw = fs.readFileSync(DATA_FILE, 'utf8');
  var data = JSON.parse(raw);

  if (!data.posts || !Array.isArray(data.posts) || data.posts.length === 0) {
    throw new Error('data/insights.json must include a non-empty "posts" array.');
  }

  data.posts.forEach(function (post, index) {
    ['id', 'title', 'meta', 'excerpt', 'url', 'tags', 'schemaHeadline', 'schemaDescription', 'schemaKeywords'].forEach(function (field) {
      if (!post[field]) {
        throw new Error('Post #' + (index + 1) + ' is missing required field "' + field + '".');
      }
      if (field === 'tags' && (!Array.isArray(post.tags) || post.tags.length === 0)) {
        throw new Error('Post #' + (index + 1) + ' must include at least one tag.');
      }
    });
  });

  data.posts.sort(function (a, b) {
    var aDate = a.datePublished || '';
    var bDate = b.datePublished || '';
    return bDate.localeCompare(aDate);
  });

  return data;
}

function renderTags(tags) {
  return tags.map(function (tag) {
    return '            <span class="tag">' + escapeHtml(tag) + '</span>';
  }).join('\n');
}

function renderGrid(posts) {
  return posts.map(function (post) {
    var url = escapeHtml(post.url);
    var title = escapeHtml(post.title);
    var meta = escapeHtml(post.meta);
    var excerpt = escapeHtml(post.excerpt);

    return [
      '        <article class="insight-card">',
      '          <div class="insight-card__meta mono">' + meta + '</div>',
      '          <h3 class="insight-card__title">',
      '            <a href="' + url + '" target="_blank" rel="noopener noreferrer">' + title + '</a>',
      '          </h3>',
      '          <p class="insight-card__excerpt">' + excerpt + '</p>',
      '          <div class="tag-list" aria-label="Topics">',
      renderTags(post.tags),
      '          </div>',
      '          <a class="insight-card__link" href="' + url + '" target="_blank" rel="noopener noreferrer author">',
      '            Read on LinkedIn',
      '            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>',
      '          </a>',
      '        </article>'
    ].join('\n');
  }).join('\n\n');
}

function renderSchemaBlock(posts) {
  var itemListElement = posts.map(function (post, index) {
    var item = {
      '@type': 'Article',
      headline: post.schemaHeadline,
      description: post.schemaDescription,
      author: { '@id': AUTHOR_ID },
      url: post.url,
      keywords: post.schemaKeywords
    };

    if (post.datePublished) {
      item.datePublished = post.datePublished;
    }

    return {
      '@type': 'ListItem',
      position: index + 1,
      item: item
    };
  });

  var block = {
    '@type': 'ItemList',
    '@id': 'https://kingsuk.github.io/#insights',
    name: 'Engineering Insights by Kingsuk Majumder',
    description: 'Articles and posts on agentic AI, cloud infrastructure, enterprise automation, and IoT.',
    itemListElement: itemListElement
  };

  return JSON.stringify(block, null, 2).split('\n').map(function (line) {
    return '      ' + line;
  }).join('\n');
}

function replaceGrid(html, content) {
  var markerPattern = new RegExp(
    '(' + GRID_BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')[\\s\\S]*?(' +
    GRID_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')'
  );

  if (markerPattern.test(html)) {
    return html.replace(markerPattern, '$1\n' + content + '\n      $2');
  }

  var gridPattern = /(<div class="insights-grid reveal reveal--delay">\s*)([\s\S]*?)(\s*<\/div>\s*\n\n      <p class="insights-cta)/;
  if (!gridPattern.test(html)) {
    throw new Error('Could not find insights grid section in index.html');
  }

  return html.replace(
    gridPattern,
    '$1\n      ' + GRID_BEGIN + '\n' + content + '\n      ' + GRID_END + '\n$3'
  );
}

function replaceSchema(html, content) {
  var pattern = /\n      \{\n        "@type": "ItemList",\n        "@id": "https:\/\/kingsuk\.github\.io\/#insights"[\s\S]*?\n      \}/;

  if (!pattern.test(html)) {
    throw new Error('Could not find insights ItemList schema block in index.html');
  }

  return html.replace(pattern, '\n' + content);
}

function main() {
  var data = loadInsights();
  var html = fs.readFileSync(INDEX_FILE, 'utf8');
  var grid = renderGrid(data.posts);

  html = replaceGrid(html, grid);
  html = replaceSchema(html, renderSchemaBlock(data.posts));

  fs.writeFileSync(INDEX_FILE, html, 'utf8');
  console.log('Built ' + data.posts.length + ' insight(s) into index.html from data/insights.json');
}

main();
