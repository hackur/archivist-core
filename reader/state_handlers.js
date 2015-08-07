var _ = require('substance/helpers');

// HACK: remember previous selection so we can check if a selection has changed
var prevSelection;

var stateHandlers = {

  handleStateChange: function(app, newState, oldState) {
    var doc = app.doc;

    function getActiveAnnotations(state) {
      // Subjects-specific
      // --------------------
      //
      // When a subject has been clicked in the subjects panel
      if (state.contextId === "subjects" && state.subjectId) {
        return _.map(doc.subjects.getReferencesForSubject(state.subjectId), function(id) {
          return doc.get(id);
        });
      }
      
      // Entities-specific
      // --------------------
      //
      // When a subject has been clicked in the subjects panel

      // Let the extension handle which nodes should be highlighted
      if (state.contextId === "entities" && state.entityId) {
        // Use reference handler
        return _.map(doc.entityReferencesIndex.get(state.entityId));
      } else if (state.entityReferenceId) {
        return [ doc.get(state.entityReferenceId) ];
      }

      return [];
    }
    var oldActiveAnnos = _.compact(getActiveAnnotations(oldState));
    var activeAnnos = getActiveAnnotations(newState);
    if (oldActiveAnnos.length || activeAnnos.length) {
      var tmp = _.without(oldActiveAnnos, activeAnnos);
      activeAnnos = _.without(activeAnnos, oldActiveAnnos);
      oldActiveAnnos = tmp;

      _.each(oldActiveAnnos, function(anno) {
        anno.setActive(false);
      });
      _.each(activeAnnos, function(anno) {
        anno.setActive(true);
      });
      return true;
    } else {
      return false;
    }
  },

  // Determine highlighted nodes
  // -----------------
  //
  // => inspects state
  //
  // TODO: this is potentially called too often
  //
  // Based on app state, determine which nodes should be highlighted in the content panel
  // @returns a list of nodes to be highlighted

  getHighlightedNodes: function(app) {
    var doc = app.doc;
    var state = app.state;

    // Subjects-specific
    // --------------------
    //
    // When a subject has been clicked in the subjects panel

    if (state.contextId === "subjects" && state.subjectId) {
      return doc.subjects.getReferencesForSubject(state.subjectId);
    }

    // Entities-specific
    // --------------------
    //
    // When a subject has been clicked in the subjects panel

    // Let the extension handle which nodes should be highlighted
    // if (state.contextId === "entities" && state.entityId) {
    //   // Use reference handler
    //   var references = Object.keys(doc.entityReferencesIndex.get(state.entityId));
    //   return references;
    // } else if (state.entityReferenceId) {
    //   return [state.entityReferenceId];
    // }

  }
};



module.exports = stateHandlers;