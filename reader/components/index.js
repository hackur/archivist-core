module.exports = {
  // Nodes
  "paragraph": require("substance-ui/paragraph_component"),
  "unsupported_node": require('../../shared/components/unsupported_node'),
  
  // Panels
  "subjects": require("../../shared/components/subjects_panel"),
  "prisons": require("./prisons_panel"),
  "locations": require("./locations_panel"),
  "persons": require("./persons_panel"),
  "definitions": require("./definitions_panel"),
  "info": require("./info_panel"),

  "prison": require("./prison"),
  "toponym": require("./location"),
  "person": require("./person"),
  "definition": require("./definition"),

  // Misc
  // "content_toolbar": require("./content_toolbar"),
  "content_container": require("./content_container")
};
