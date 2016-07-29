var fs = require('fs');

var text = fs.readFileSync(__dirname + '/../index.js', 'utf8');

var textarea = document.querySelector('textarea#doc');
var crate = require('crate-core');

var diffsToOps = (diffs) => {
  var start = 0;
  var end = 0;
  var type = 0;
  var text = '';
  var diff;
  for (var i = 0; i < diffs.length; i++) {
    var exit = false;
    diff = diffs[i];
    [type, text] = diff;

    switch (type) {
      case 0:
        // No change
        start = start + text.length;
        end = end + text.length;
        break;
      case 1:
        // Addition
        end = end + text.length;
        exit = true;
        break;
      case -1:
        // Removal
        end = end + text.length;
        exit = true;
        break;
    }

    if (exit) { break; }
  }

  var e;
  var [type, text] = diff;
  switch (type) {
    case 1:
      e = {
        action: 'insert',
        start,
        end,
        text
      };
      break;
    case -1:
      e = {
        action: 'remove',
        start,
        end,
        text
      };
      break;
    default:
      return;
  }

  return [e];
};

module.exports = stream => {
  var doc = new crate(null, stream);
  window.doc = doc;

  if (stream.server) {
    console.log('Sending initial state');

    // Sssshhhh
    var send = stream.send;
    stream.send = () => {};

    // Start off doc with contents of textarea.
    doc.insert('\n', 0);

    stream.send = send;

    var initial = JSON.stringify(doc.sequence);
    doc.broadcast.send(initial);
    edit(doc);
  } else {
    console.log('Awaiting initial state...');
    var cb = (initial) => {
      console.log('Received initial state...');
      doc.sequence.fromJSON(JSON.parse(initial));
      edit(doc);
    };
    doc.broadcast.once('message', cb);
  }
}

function getStringChildNode(childNode){
  var result = '';
  if (childNode.e !== null){ result = childNode.e; };
  for (var i=0; i<childNode.children.length; ++i){
    result += getStringChildNode(childNode.children[i]);
  };
  return result;
};

var docToString = (doc) => getStringChildNode(doc.sequence.root);

var isConsistent = (doc, editor) => docToString(doc) === editor.getContent();

var edit = (doc) => {
  var editor = window.editor;

  editor.setContent(docToString(doc));

  var debug = () => {
    console.log(docToString(doc));

    if(!isConsistent(doc, editor)) {
      console.warn('INCONSISTENT');
      debugger;
    }
  };

  window.docAsString = () => docToString(doc);
  window.debug = debug;

  // var insertRemoveOp = false;
  //
  // editor.getSession().getSelection().on('changeCursor', function(e, sel){
  //   if (!insertRemoveOp){
  //     var range = sel.getRange();
  //     doc.caretMoved({
  //       start: editor.getSession().getDocument().positionToIndex(range.start),
  //       end: editor.getSession().getDocument().positionToIndex(range.end)
  //     });
  //   }
  //   insertRemoveOp = false;
  // });

  editor.on('contentChangedExt', (_, diffs) => {
    var ops = diffsToOps(diffs);

    ops.forEach(({ start, end, text, action }) => {
      var j = 0;
      for (var i=start; i<end; ++i){
        switch (action){
          case 'insert':
            console.log('insert: ' + text[j] + ' at ' + i);
            doc.insert(text[j], i);
            break;
          case 'remove':
            console.log('remove: ' + text[j] + ' at ' + start);
            doc.remove(start);
            break;
        };
        ++j;
      };
    });

    debug();
  });

  doc.on('remoteInsert', (element, index) => {
    if (index === -1) { return; }
    editor.watcherExt.noWatch(() => {
      console.log('remote insert: ' + element + ' at ' + index);
      editor.replace(index-1, index-1, element);
    });
    debug();
  });

  doc.on('remoteRemove', (index) => {
    if (index === -1) { return; }
    editor.watcherExt.noWatch(() => {
      console.log('remote remove: ' + editor.getContent().split('')[index-1] + ' at ' + (index-1));
      editor.replace(index-1, index, '');
    });
    debug();
  });
};
