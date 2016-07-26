var fs = require('fs');

var text = fs.readFileSync(__dirname + '/../index.js', 'utf8');

var textarea = document.querySelector('textarea#doc');
var crate = require('crate-core');

module.exports = stream => {
  var doc = new crate(null, stream);

  var editor = window.editor;

  // #B initialize the string within the editor
  function getStringChildNode(childNode){
    var result = '';
    if (childNode.e !== null){ result = childNode.e; };
    for (var i=0; i<childNode.children.length; ++i){
      result += getStringChildNode(childNode.children[i]);
    };
    return result;
  };

  // Start off doc with contents of textarea.
  // doc.insert('\n', 0);

  editor.setContent(getStringChildNode(doc.sequence.root));

  var insertRemoveOp = false;

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
    var start = 0;
    var end = 0;
    var text = '';
    var diff;
    for (var i = 0; i < diffs.length; i++) {
      var exit = false;
      diff = diffs[i];
      var [type, text] = diff;

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
        };
        break;
      default:
        return;
    }

    var begin, end, text, message, j=0;

    console.log('Change:');

    begin = e.start;
    end = e.end;

    console.log(e);
    console.log(`from ${begin} to ${end}`);

    for (var i=begin; i<end; ++i){
      switch (e.action){
        case 'insert':
          console.log('insert: ' + text[j]);
          doc.insert(text[j], i);
          console.log(`${text[j]}, ${i}`);
          break;
        case 'remove':
          console.log('remove');
          doc.remove(begin);
          console.log(begin)
            break;
      };
      ++j;
    };
  });

  doc.on('remoteInsert', (element, index) => {
    if (index === -1) { return; }
    editor.watcherExt.noWatch(() => {
      // editor.watcher.noWatch(() => {
        editor.replace(index, index, element);
      // });
    });
  });

  doc.on('remoteRemove', (index) => {
    if (index === -1) { return; }
    editor.watcherExt.noWatch(() => {
      // editor.watcher.noWatch(() => {
        editor.replace(index, index+1, '');
      // });
    });
  });
};
