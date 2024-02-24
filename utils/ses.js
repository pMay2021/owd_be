#!/usr/bin/env node

const { program } = require("commander");
const fs = require('fs');
const path = require('path');
const { JSDOM }  = require('jsdom');
const { marked }  = require('marked');

program
  .option('-f, --file <type>', 'Specify the .md file')
  .option('-a, --action <type>', 'Specify the action (template)')
  .option('-n, --name <type>', 'Specify the template name')
  .option('-s, --subj <type>', 'Specify the subject')
  .parse(process.argv);

const options = program.opts();

// Validate file extension
if (path.extname(options.file) !== '.md') {
  console.error('Error: Input file must be a .md file.');
  process.exit(1);
}

// Read file content
const fileContent = fs.readFileSync(options.file, 'utf8');

if (options.action === 'template') {

let html = marked(fileContent);

    // Parse HTML content and extract text
 const dom = new JSDOM(html);
 const textContent = dom.window.document.body.textContent || '';

  // Create SES template
  const sesTemplate = {
    "Template": {
    TemplateName: options.name || "Your Template Name Here",
    SubjectPart: options.subj || "Your Subject Here",
    TextPart: textContent,
    HtmlPart: html
    }
  };

  // Print the SES template to the terminal
  console.log(JSON.stringify(sesTemplate, null, 2));
} else {
  console.log('Invalid type. Only "template" type is supported.');
}
