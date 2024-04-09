#!/usr/bin/env node

const { program } = require("commander");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { marked } = require("marked");
const readline = require("readline");
const { exec } = require("child_process");

program
  .option("-f, --file <type>", "Specify the .md file")
  .option("-a, --action <type>", "Specify the action (add/update)")
  .option("-s, --subj <type>", "Specify the subject")
  .parse(process.argv);

const options = program.opts();

// Validate file extension
if (path.extname(options.file) !== ".md") {
  console.error("Error: Input file must be a .md file.");
  process.exit(1);
}

// Read file content
const fileContent = fs.readFileSync(options.file, "utf8");

let html = marked(fileContent);
html = html.replace(/%7B%7B/g, '{{').replace(/%7D%7D/g, '}}');

// Parse HTML content and extract text
const dom = new JSDOM(html);
const textContent = dom.window.document.body.textContent || "";

// Transform file name to template name
const templateName = path
  .basename(options.file, ".md")
  .replace(/^ses-/, "") // Remove "ses_" prefix
  .replace(/(?:^|\s)\S/g, (match) => match.toLowerCase()) // Capitalize each word

  console.log("creating templateName: ", templateName);

// Create SES template
const sesTemplate = {
  Template: {
    TemplateName: templateName,
    SubjectPart: options.subj || "Your Subject Here",
    TextPart: textContent,
    HtmlPart: html,
  },
};

// Create the output directory if it doesn't exist
const outputDir = path.join(path.dirname(options.file), "json");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Generate the output file path
const outputFileName = path.basename(options.file, ".md") + ".json";
const outputPath = path.join(outputDir, outputFileName);

// Write the SES template to the output file
fs.writeFileSync(outputPath, JSON.stringify(sesTemplate, null, 2));

const answer = options.action;

if (answer === "add") {
  // Execute shell command to add template
  const command = `aws ses create-template --cli-input-json file://${outputPath}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    console.log(stdout);
    console.log(`SES template ${templateName} created on AWS and saved to ${outputPath}`);
  });
} else if (answer === "update") {
  // Execute shell command to update template
  const command = `aws ses update-template --cli-input-json file://${outputPath}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    console.log(stdout);
    console.log(`SES template ${templateName} updated on AWS and saved to ${outputPath}`);
  });
} else {
  console.log("Invalid option. Only 'add' or 'update' are supported.");
}
