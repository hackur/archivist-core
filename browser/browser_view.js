"use strict";

var _ = require("substance/helpers");
var View = require("substance-application").View;
var $$ = require("substance-application").$$;
var SearchbarView = require("./searchbar_view");
var PreviewView = require("./preview_view");
var FacetsView = require("./facets_view");
var util = require("./util");

// React Component
var TreeComponent = require("../shared/components/tree");

var ARTICLE_TYPES = {
  "Research article": "research-article",
  "Feature article": "feature-article",
  "Insight": "insight",
  "Correction": "correction",
  "Short report": "short-report",
  "Editorial": "editorial",
  "Research advance": "research-advance",
  "Registered report": "registered-report",
};

// Browser.View Constructor
// ========
//

var BrowserView = function(controller) {
  View.call(this);

  this.controller = controller;
  this.$el.attr({id: "container"});

  // Elements
  // --------

  // Search bar
  // ------------

  this.searchbarView = new SearchbarView(this.controller, {
    getSuggestions: _.bind(this.controller.getSuggestions, this.controller)
  });

  // List of found documents
  // ------------
  // 

  this.facetsEl = $$('#facets');
  this.documentsEl = $$('#documents');
  this.documentsEl.appendChild($$('.no-result', {text: "Loading documents ..."}));

  this.previewEl = $$('#preview');


  // Wrap what we have into a panel wrapper
  this.panelWrapperEl = $$('.panel-wrapper');
  this.panelWrapperEl.appendChild(this.facetsEl);
  this.panelWrapperEl.appendChild(this.documentsEl);
  this.panelWrapperEl.appendChild(this.previewEl);
  
  // Loading spinner
  this.progressbarEl = $$('.progress-bar', {
    html: '<div class="progress loading"></div>'
  });


  // Event handlers
  // ------------

  this.$el.on('click', '.available-facets .value', _.bind(this.toggleFilter, this));
  this.$el.on('click', '.document .toggle-preview', _.bind(this.togglePreview, this));
  this.$el.on('click', '.show-more', _.bind(this._preventDefault, this));

  // this.$el.on('click', '.available-facets .value', _.bind(this.addEntity, this));

  // Each time the search query changes we re-render the facets panel
  // this.controller.searchQuery.on('query:changed', _.bind(this.renderFacets, this));
};

BrowserView.Prototype = function() {

  this._preventDefault = function(e) {
    e.preventDefault();
  };

  this.togglePreview = function(e) {
    e.preventDefault();

    var searchQuery = this.controller.searchQuery;
    var $documentEl = $(e.currentTarget).parent();
    var documentId = $documentEl.attr('data-id');
    var self = this;

    var $preview = $documentEl.find('.preview');
    if ($preview.length > 0) {
      $preview.toggle();
    } else {
      this.showLoading();
      this.controller.loadPreview(documentId, searchQuery.searchStr, function(err) {
        self.renderPreview();
        self.hideLoading();
      });
    }
  };

  this.toggleFilter = function(e) {
    e.preventDefault();
    var facet = $(e.currentTarget).attr("data-facet");
    var facetValue = $(e.currentTarget).attr("data-value");

    this.controller.searchQuery.toggleFilter(facet, facetValue);
  };

  // Show the loading indicator
  this.showLoading = function() {
    $('.progress-bar').removeClass('done loading').show();
    _.delay(function() {
      $('.progress-bar').addClass('loading');
    }, 10);
  };

  // Hide the loading indicator
  this.hideLoading = function() {
    $(this.loadingEl).hide();
    $('.progress-bar').addClass('done');

    _.delay(function() {
      $('.progress-bar').hide();
    }, 1000);
  };

  // Rendering
  // ==========================================================================
  //

  // After state transition
  // --------------
  // 

  this.afterTransition = function(oldState, newState) {
    if (newState.id === "main") {
      if (!_.isEqual(newState.searchQuery, oldState.searchQuery)) {
        this.renderSearchResult();
        this.hideLoading();
      }
    }
  };

  this.renderPreview = function() {
    var previewData = this.controller.previewData;
    var documentId = previewData.document.id;

    if (this.controller.previewData) {
      var previewEl = new PreviewView(previewData);

      // Highlight previewed document in result list
      this.$('.document').each(function() {
        if (documentId === this.dataset.id) {
          this.appendChild(previewEl.render().el);
        }
      });
    }
  };

  this.renderFacets = function() {
    // this.facetsView = new FacetsView(this.controller.searchResult.getFacets());
    // this.facetsEl.innerHTML = "";
    // this.facetsEl.appendChild(this.facetsView.render().el);

    // Subjects Filters
    // -------------
    // 

    var subjectFilters = this.controller.state.searchQuery.filters["subjects"] || [];
    React.render(
      React.createElement(TreeComponent, {
        selectedNodes: subjectFilters,
        tree: this.controller.searchResult.subjects.getTree(),
        counts: this.controller.searchResult.getFacetCounts("subjects"),
        onSelectionChanged: function(selectedNodes) {
          var selectedSubjects = Object.keys(selectedNodes);
          console.log('selected nodes', selectedSubjects);
          this.controller.searchQuery.addFilter("subjects", selectedSubjects);
        }.bind(this)
      }),
      this.facetsEl
    );
  };

  // Display initial search result
  this.renderSearchResult = function() {
    var searchStr = this.controller.state.searchQuery.searchStr;
    var filters = this.controller.state.searchQuery.filters;

    // Check if there's an actual search result
    if (!this.controller.searchResult) return;

    this.documentsEl.innerHTML = "";

    // Get filtered documents
    var documents = this.controller.searchResult.getDocuments();
    var searchMetrics = this.controller.searchResult.getSearchMetrics();
    
    if (documents.length > 0) {

      this.documentsEl.appendChild($$('.no-result', {text: searchMetrics.hits + " articles found"}));

      _.each(documents, function(doc, index) {

        // Matching filters
        // --------------

        var filtersEl = $$('.filters');

        _.each(doc.facets, function(facet, facetKey) {
          _.each(facet, function(count, id) {
            var filterEl = $$('.filter', {text: id+" occured "+count+" times"});
            filtersEl.appendChild(filterEl);
          });
        });

        // Suggested filters
        // --------------

        var relatedFiltersEl = $$('.related-filters', {text: "Related: "});

        _.each(doc.suggestedEntities, function(entity, id) {
          var filterEl = $$('a.related-filter', {
            href: '#',
            text: id,
            "data-id": id
          });
          relatedFiltersEl.appendChild(filterEl);
        });

        var elems = [
          $$('.meta-info', {
            children: [
              // $$('.article-type.'+ARTICLE_TYPES[doc.article_type], {html: doc.article_type+" "}),
              // $$('.doi', {html: doc.doi+" "}),

              $$('.published-on', {text: "published on "+ util.formatDate(doc.published_on)})
            ]
          }),
          $$('.title', {
            children: [

              $$('a', { href: 'http://ost.d4s.io/archivist/editor/'+doc.id, target: "_blank", html: doc.title })
            ]
          }),
        ];

        if (doc.intro) {
          elems.push($$('.intro', {
            html: doc.intro
          }));
        }

        // elems.push($$('.authors', {
        //   html: doc.authors_string
        // }));

        if (filtersEl.childNodes.length > 0) {
          elems.push(filtersEl);  
        }

        if (relatedFiltersEl.childNodes.length > 0) {
          elems.push(relatedFiltersEl);  
        }

        var documentEl = $$('.document', {
          "data-id": doc.id,
          children: elems
        });


        // Render preview
        // -----------

        // var previewData = doc.fragments;
        // var documentId = previewData.document.id;

        if (doc.fragments) {
          var previewEl = new PreviewView({
            document: doc,
            fragments: doc.fragments,
            searchStr: searchStr
          });

          // Highlight previewed document in result list
          documentEl.appendChild(previewEl.render().el);
        }

        // // TODO: replace this with check doc.matches_count > 0
        // if (searchStr) {
        //   var togglePreviewEl = $$('a.toggle-preview', {href: "#", html: '<i class="fa fa-eye"></i> Show matches for "'+searchStr+'"'});
        //   documentEl.appendChild(togglePreviewEl);
        // }

        this.documentsEl.appendChild(documentEl);
      }, this);

    } else {
      // Render no search result
      this.documentsEl.appendChild($$('.no-result', {text: "Your search did not match any documents"}));
    }

    this.renderFacets();
    this.searchbarView.renderFilters();
  };

  this.render = function() {
    this.el.innerHTML = "";
    this.el.appendChild(this.searchbarView.render().el);
    this.el.appendChild(this.panelWrapperEl);
    this.el.appendChild(this.progressbarEl);
    return this;
  };

  this.dispose = function() {
    this.stopListening();
    if (this.mainView) this.mainView.dispose();
  };
};

// Export
// --------

BrowserView.Prototype.prototype = View.prototype;
BrowserView.prototype = new BrowserView.Prototype();

module.exports = BrowserView;