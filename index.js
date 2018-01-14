#!/usr/bin/env node

var fs          = require('fs');
var Joi         = require('joi');
var program     = require('commander');
var chalk       = require('chalk');
var clear       = require('clear');
var figlet      = require('figlet');
var inquirer    = require('inquirer');

function initCLI() {
  program
    .version('0.1.0')
    .description('Command line based quiz game')
    .option('-f, --file [value]', 'Quiz json-format file')
    .parse(process.argv);
}

function quizTitle(title) {
  clear();
  console.log(
    chalk.green(
      figlet.textSync(title.toUpperCase(), { horizontalLayout: 'full' })
    )
  );
}

function error(text) {
  console.log(
    chalk.red(text)
  );
}

function readFile() {
  var file = program.file;
  var rawQuiz;

  if(!file) {
    error("No file is specified");
    process.exit(1);
  }

  if(!fs.existsSync(file)) {
    error("File not found");
    process.exit(1);
  }

  try {
    rawQuiz = fs.readFileSync(file)
  } catch(err) {
    error('File open error');
    process.exit(1);
  }

  return rawQuiz;
}

function validate(jsonData) {
  var quizFormat = Joi.object().keys({
    question: Joi.string().required(),
    choices: Joi.array().items(Joi.string(), Joi.number()),
    answer: Joi.number().required()
  });

  var format = Joi.object().keys({
    title: Joi.string().required(),
    content: Joi.array().items(quizFormat)
  });

  var test = Joi.validate(jsonData, format);

  if(test.error) {
    error('Json format error');
    process.exit(1);
  }

  return jsonData;
}

function parseJson(rawQuiz) {
  return validate(JSON.parse(rawQuiz));
}

function initQuiz() {
  var rawQuiz = readFile();
  var jsonQuiz = parseJson(rawQuiz);
  var quizContent = jsonQuiz.content;

  var title = jsonQuiz.title;
  var questions = [];
  var standards = {};

  for(var i = 0; i < quizContent.length; i++) {
    var quiz = quizContent[i];
    var order = i + 1;
    var name = 'q' + order;

    questions.push({
      type: 'list',
      name: name,
      message:  chalk.red(order + ') ') + chalk.italic(quiz.question),
      choices: quiz.choices
    });

    standards[name] = quiz.choices[+quiz.answer-1];
  }

  return {
    title: title,
    questions: questions,
    standards: standards
  }
}

function readPersonal() {
  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'name',
        message: chalk.blue('Enter your name:'),
        validate: function( value ) {
          if (value.length) {
            return true;
          } else {
            return 'Please enter your name.';
          }
        }
      },
      {
        type: 'input',
        name: 'id',
        message: chalk.blue('Enter your id:')
      }
    ])
}

function initPaper() {
  var quiz = initQuiz();

  var title = quiz.title;
  var questions = quiz.questions;
  var standards = quiz.standards;

  quizTitle(title);

  readPersonal().then(function(personal) {
    inquirer.prompt(questions).then(function(answers) {
      var results = 0;

      for(var question in answers) {
        if(answers[question] === standards[question]) {
          results += 1;
        }
      }

      console.log(
        chalk.yellow(
          '\nCongrats ' + personal.name + ' ' + personal.id +
          '\nYou got ' + results + ' of ' + questions.length + ' questions'
        )
      )
    });
  });
}

initCLI();
initPaper();
