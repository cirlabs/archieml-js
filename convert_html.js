#!/usr/bin/env node

var archieml = require('../archieml.js');
var url = require('url');
var htmlparser = require('htmlparser2');
var Entities = require('html-entities').AllHtmlEntities;
var fs = require('fs');

var handler = new htmlparser.DomHandler(function(error, dom) {
  var tagHandlers = {
    _base: function(tag) {
      var str = '';
      tag.children.forEach(function(child) {
        if (func = tagHandlers[child.name || child.type]) str += func(child);
      });
      return str;
    },
    text: function(textTag) {
      return textTag.data;
    },
    span: function(spanTag) {
      return tagHandlers._base(spanTag);
    },
    p: function(pTag) {
      return tagHandlers._base(pTag) + '\n';
    },
    a: function(aTag) {
      var href = aTag.attribs.href;
      if (href === undefined) return '';

      // extract real URLs from Google's tracking
      // from: http://www.google.com/url?q=http%3A%2F%2Fwww.nytimes.com...
      // to: http://www.nytimes.com...
      if (aTag.attribs.href && url.parse(aTag.attribs.href, true).query && url.parse(aTag.attribs.href, true).query.q) {
        href = url.parse(aTag.attribs.href, true).query.q;
      }

      var str = '<a href="' + href + '">';
      str += tagHandlers._base(aTag);
      str += '</a>';
      return str;
    },
    li: function(tag) {
      return '* ' + tagHandlers._base(tag) + '\n';
    }
  };

  ['ul', 'ol'].forEach(function(tag) {
    tagHandlers[tag] = tagHandlers.span;
  });
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(function(tag) {
    tagHandlers[tag] = tagHandlers.p;
  });

  var body = dom[0].children[1];
  var parsedText = tagHandlers._base(body);

  // Convert html entities into the characters as they exist in the google doc
  var entities = new Entities();
  parsedText = entities.decode(parsedText);

  // Remove smart quotes from inside tags
  parsedText = parsedText.replace(/<[^<>]*>/g, function(match) {
    return match.replace(/”|“/g, '"').replace(/‘|’/g, "'");
  });

  var parsed = archieml.load(parsedText);

  fs.writeFileSync("output.json", JSON.stringify(parsed));
});


// get html file
const body = fs.readFileSync('../input.html');

// build parser
var parser = new htmlparser.Parser(handler);

// load up html file
parser.write(body);

parser.done();
