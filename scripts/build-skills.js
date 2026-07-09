#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var DATA_FILE = path.join(ROOT, 'data', 'skills.json');
var INDEX_FILE = path.join(ROOT, 'index.html');
var BLOCK_BEGIN = '<!-- SKILLS:LINKEDIN:BEGIN -->';
var BLOCK_END = '<!-- SKILLS:LINKEDIN:END -->';

var PORTFOLIO_KNOWS_ABOUT = [
  'Agentic AI',
  'Cloud Infrastructure',
  'AWS',
  'DevOps',
  'IoT',
  'Enterprise Automation',
  'Software Engineering'
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadSkills() {
  var data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  if (!data.categories || !Array.isArray(data.categories) || data.categories.length === 0) {
    throw new Error('data/skills.json must include a non-empty "categories" array.');
  }

  data.categories.forEach(function (category, index) {
    if (!category.label || !category.skills || !Array.isArray(category.skills) || category.skills.length === 0) {
      throw new Error('Category #' + (index + 1) + ' must include "label" and a non-empty "skills" array.');
    }
  });

  return data;
}

function uniqueSkills(data) {
  var seen = {};
  var skills = [];

  data.categories.forEach(function (category) {
    category.skills.forEach(function (skill) {
      var key = skill.toLowerCase();
      if (!seen[key]) {
        seen[key] = true;
        skills.push(skill);
      }
    });
  });

  return skills;
}

function renderSkillTags(skills) {
  return skills.map(function (skill) {
    return '              <span class="tag">' + escapeHtml(skill) + '</span>';
  }).join('\n');
}

function renderCertifications(certifications) {
  if (!certifications || certifications.length === 0) {
    return '';
  }

  var items = certifications.map(function (cert) {
    return [
      '            <li>',
      '              <strong>' + escapeHtml(cert.name) + '</strong>',
      cert.issuer ? '              <span>' + escapeHtml(cert.issuer) + '</span>' : '',
      '            </li>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  return [
    '          <div class="linkedin-skills__certs">',
    '            <h4 class="linkedin-skills__subtitle mono">Licenses &amp; Certifications</h4>',
    '            <ul class="cert-list">',
    items,
    '            </ul>',
    '          </div>'
  ].join('\n');
}

function renderLinkedInBlock(data) {
  var profile = escapeHtml(data.linkedinProfile || 'https://www.linkedin.com/in/kingsuk-majumder-2812a58a/');
  var groups = data.categories.map(function (category) {
    return [
      '          <div class="linkedin-skills__group">',
      '            <h4 class="linkedin-skills__subtitle mono">' + escapeHtml(category.label) + '</h4>',
      '            <div class="tag-list" aria-label="' + escapeHtml(category.label) + ' skills">',
      renderSkillTags(category.skills),
      '            </div>',
      '          </div>'
    ].join('\n');
  }).join('\n');

  return [
    '          <p class="linkedin-skills__intro">Skills listed on my <a href="' + profile + '" target="_blank" rel="noopener noreferrer me">LinkedIn profile</a>, grouped for quick scanning.</p>',
    renderCertifications(data.certifications),
    '          <div class="linkedin-skills__groups">',
    groups,
    '          </div>'
  ].filter(Boolean).join('\n');
}

function renderKnowsAbout(skills) {
  var merged = PORTFOLIO_KNOWS_ABOUT.concat(skills);
  var seen = {};
  var output = [];

  merged.forEach(function (skill) {
    var key = skill.toLowerCase();
    if (!seen[key]) {
      seen[key] = true;
      output.push(skill);
    }
  });

  return output.map(function (skill) {
    return '          ' + JSON.stringify(skill);
  }).join(',\n');
}

function replaceLinkedInBlock(html, content) {
  var markerPattern = new RegExp(
    '(' + BLOCK_BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')[\\s\\S]*?(' +
    BLOCK_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')'
  );

  if (markerPattern.test(html)) {
    return html.replace(markerPattern, '$1\n' + content + '\n          $2');
  }

  throw new Error('Could not find LinkedIn skills markers in index.html');
}

function replaceKnowsAbout(html, content) {
  var pattern = /"knowsAbout": \[\n[\s\S]*?\n        \]/;

  if (!pattern.test(html)) {
    throw new Error('Could not find Person knowsAbout block in index.html');
  }

  return html.replace(pattern, '"knowsAbout": [\n' + content + '\n        ]');
}

function main() {
  var data = loadSkills();
  var html = fs.readFileSync(INDEX_FILE, 'utf8');
  var linkedInSkills = uniqueSkills(data);

  html = replaceLinkedInBlock(html, renderLinkedInBlock(data));
  html = replaceKnowsAbout(html, renderKnowsAbout(linkedInSkills));

  fs.writeFileSync(INDEX_FILE, html, 'utf8');
  console.log('Built ' + linkedInSkills.length + ' LinkedIn skill(s) into index.html from data/skills.json');
}

main();
