var fs = require('fs');
var Marker = require('../utils/marker');

var text = fs.readFileSync(__dirname + '/../index.js', 'utf8');

var textarea = document.querySelector('textarea#doc');
var crate = require('crate-core');
require('ace-builds/src/ace');
require('ace-builds/src/theme-twilight');
require('ace-builds/src/mode-javascript');

var Range = window.require('ace/range').Range;

var ace = window.ace;

module.exports = stream => {
  var doc = new crate(null, stream);

  var editor = ace.edit(textarea);
  window.editor = editor;
  editor.getSession().setUseWorker(false);
  editor.setReadOnly(false);
  editor.setTheme("ace/theme/twilight");
  editor.session.setMode("ace/mode/javascript");

  var fromRemote = false;

  // #B initialize the string within the editor
  function getStringChildNode(childNode){
    var result = '';
    if (childNode.e !== null){ result = childNode.e; };
    for (var i=0; i<childNode.children.length; ++i){
      result += getStringChildNode(childNode.children[i]);
    };
    return result;
  };

  editor.setValue(getStringChildNode(doc.sequence.root),1);

  var insertRemoveOp = false;

  editor.getSession().getSelection().on('changeCursor', function(e, sel){
    if (!insertRemoveOp){
      var range = sel.getRange();
      doc.caretMoved({
        start: editor.getSession().getDocument().positionToIndex(range.start),
        end: editor.getSession().getDocument().positionToIndex(range.end)
      });
    }
    insertRemoveOp = false;
  });

  editor.getSession().on('change', function(e) {
    console.log(e);
    var begin, end, text, message, j=0;

    if (fromRemote) {
      console.log('Remote change:');
    } else {
      console.log('Change:');
    }

    if (!fromRemote){
      // #1 process the boundaries from range to index and text
      begin = editor.getSession().getDocument().positionToIndex(
          e.start);

      switch (e.action){
        case 'remove':
          end = begin;
          for (var i=0; i<e.lines.length;++i){
            end += e.lines[i].length+1; // +1 because of \n
          };
          end = end - 1;
          // remoteCaretsUpdate(begin, begin-end);
          break;
        case 'insert':
          text = e.lines.join('\n');
          end = begin + text.length;
          // remoteCaretsUpdate(begin, text.length);
          break;
      };
      // #2 update the underlying CRDT model and broadcast the results
      for (var i=begin; i<end; ++i){
        switch (e.action){
          // case 'insertText': doc.insert(text[j], i); break;
          case 'insert':
            console.log('insert: ' + text[j]);
            doc.insert(text[j], i);
            break;
            // case 'removeText': doc.remove(begin); break;
          case 'remove':
            console.log('remove');
            doc.remove(begin);
            break;
        };
        ++j;
      };
    };
  });

  doc.on('remoteInsert', function(element, index){
    var aceDocument = editor.getSession().getDocument(),
    delta,
    tempFromRemote;
    if (index!==-1){
      var lines = [element];
      if (element === '\n') {
        lines = ["", ""];
      }
      delta = {action: 'insert',
        start: aceDocument.indexToPosition(index-1),
        end:   aceDocument.indexToPosition(index),
        lines: lines},
      console.log(delta);
      tempFromRemote = fromRemote;
      fromRemote = true;
      aceDocument.applyDeltas([delta]);
      // remoteCaretsUpdate(index,1);
      fromRemote = tempFromRemote;
    };
  });

  doc.on('remoteRemove', function(index){
    var aceDocument = editor.getSession().getDocument(),
    delta,
    tempFromRemote;
    if (index !== -1){
      delta = {action: 'remove',
        start: aceDocument.indexToPosition(index - 1),
        end:   aceDocument.indexToPosition(index)};
      console.log(delta);
      tempFromRemote = fromRemote;
      fromRemote = true;
      aceDocument.applyDeltas([delta]);
      // remoteCaretsUpdate(index,-1);
      fromRemote = tempFromRemote;
    };
  });

  var markerId;
  doc.on('remoteCaretMoved', function(range, origin){
    // if (!origin) return;
    var aceDocument = editor.getSession().getDocument();
    var start = aceDocument.indexToPosition(range.start);
    var end   = aceDocument.indexToPosition(range.end);
    range = new Range(start.row, start.column, end.row, end.column);
    console.log(range);
    // if (editor.session.remoteCarets[origin]){
    //     // #A update the existing cursor
    //     // var marker = editor.session.remoteCarets[origin];
    //     console.log(marker);
    //     marker.cursors = [range]; // save the cursors as indexes
    //     editor.getSession()._signal('changeFrontMarker');
    //     // marker.refresh();
    // }else{
        // #B create a new cursor
        // var marker = new Marker(editor.session, origin, range);
        // console.log(marker);
        // editor.session.addDynamicMarker(marker, true);
        // editor.session.remoteCarets[origin] = marker;
        editor.session.removeMarker(markerId, true);
        markerId = editor.session.addMarker(range, 'remote-marker', null, true);
        // marker.refresh();
        // call marker.session.removeMarker(marker.id) to remove it
        // call marker.redraw after changing one of cursors
    // }
  });

  // editor.session.remoteCarets = {};
  // function remoteCaretsUpdate(index, length){
  //   var change = false, document = editor.session.getDocument();
  //   for (origin in editor.session.remoteCarets){
  //     var remoteCaret = editor.session.remoteCarets[origin];
  //     for (i=0; i<remoteCaret.cursors.length; ++i){
  //       var cursor = remoteCaret.cursors[i];
  //       if (cursor.start >= index){
  //         cursor.start += length;
  //         change = true;
  //       }
  //       if (cursor.end >= index){
  //         cursor.end += length;
  //         change = true;
  //       }
  //     }
  //   }
  //   if (change){
  //     editor.session._signal('changeFrontMarker');
  //   }
  // };
};
