var mainModule= angular.module('mainModule', ['ngSanitize','infinite-scroll','autocomplete-directive'], function($httpProvider)
{
  // Use x-www-form-urlencoded Content-Type
  // Angular's POST isn't natively undestood by PHP
  // fix via: http://victorblog.com/2012/12/20/make-angularjs-http-service-behave-like-jquery-ajax/
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function(data)
  {
    /**
     * The workhorse; converts an object to x-www-form-urlencoded serialization.
     * @param {Object} obj
     * @return {String}
     */
    var param = function(obj)
    {
      var query = '';
      var name, value, fullSubName, subValue, innerObj, i;
      for(name in obj)
      {
        value = obj[name];
        if(value instanceof Array)
        {
          for(i=0; i<value.length; ++i)
          {
            subValue = value[i];
            fullSubName = name + '[' + i + ']';
            innerObj = {};
            innerObj[fullSubName] = subValue;
            query += param(innerObj) + '&';
          }
        }
        else if(value instanceof Object)
        {
          for(subName in value)
          {
            subValue = value[subName];
            fullSubName = name + '[' + subName + ']';
            innerObj = {};
            innerObj[fullSubName] = subValue;
            query += param(innerObj) + '&';
          }
        }
        else if(value !== undefined && value !== null)
        {
          query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
        }
      }
      return query.length ? query.substr(0, query.length - 1) : query;
    };
    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
  }];
}).filter('split', function() {
    return function(input, sep) {
      var out = [];
      if(!input){return out;}
      if(!sep){ sep=',';}
      return _.chain(input.split(sep))
              .map(function(item){return item.trim()})
              .unique()
              .compact()
              .value();

      //return _.compact(String.split(input,sep));
    }
  });
//via https://stackoverflow.com/a/14837021/13774
mainModule.directive('focusMe', function($timeout, $parse) {
  return {
    //scope: true,   // optionally create a child scope
    link: function(scope, element, attrs) {
      var model = $parse(attrs.focusMe);
      scope.$watch(model, function(value) {
        console.log('value=',value);
        if(value === true) {
          $timeout(function() {
            element[0].focus();
          });
        }
      });
      // to address @blesh's comment, set attribute value to 'false'
      // on blur event:
      element.bind('blur', function() {
         console.log('blur');
         //model.assign(scope,false);
         //scope.$apply(model.assign(scope, false));
      });
    }
  };
});

mainModule.factory('nonceService', function($http, $log){

});
mainModule.factory('feedService',   function($http,$log){
  /*
   * The Feed Service should be the interface to feeds.
   *
   * It maintains a list of feeds, a pointer to a current feed,
   * and ways to refresh the list, select the next feed, mark a feed read
   * or get the entries from a feed.
   */
  // the list of feeds;
  var _feeds = [];
  // the currently selected feed
  var _selectedFeed = null;
  // feeds organized by tags
  var _tags = {};
  // a list of all tags for this user
  var _allTags = [];
  //is this service doing work?
  var _isLoading = false;
  var _isEntriesLoading = false;
  var _sortOrder = "-1";
  var _showRead = 0;
  var _showByTags = false;
  var _sortOptions = [
    { sortOrder: "-1",
      sortName: "Newest First",
    },
    { sortOrder: "1",
      sortName: "Oldest First",
    },
  ];
  //the current entries we've got stored for this feed
  var _entries = [];
  //if we have a current entry it will be here
  var _selectedEntry = null;
  getEntriesQualifier = function(feed){
    var qualifier = '';
    //If we aren't passed a feed filter, don't create one
    if(null == feed ){
      //qualifier =  'feed_id='+null;
    }
    else if(feed.feed_id && feed.feed_id >-1){
      qualifier = '&feed_id='+feed.feed_id;
      //if it has a feed_id, we can assume it is a feed
    }
    else if (feed.feed_id <0){
      //handles special feeds
      //
      // -1 = ALL FEEDS

    }
    else {
      //we should assume it is a tag
      if('Untagged' == feed){
        qualifier = '&tag='+null;
      }
      else{
        qualifier = '&tag='+feed;
      }
    }
    return qualifier;
  };

  var feedservice =  {
    feeds : function(){
      if(  _feeds.length == 0 && ! _isLoading){
        feedservice.refresh();
      }
      return _feeds;
    },
    isLoading : function(){
      return _isLoading;
    },
    isEntriesLoading : function(){
      return _isEntriesLoading;
    },
    tags: function(){
      if(_tags.length == 0 && ! _isLoading ){ _refresh();}
      return _tags;
    },
    allTags: function(){
      return _allTags;
    },
    entries: function(){
      return _entries;
    },
    showRead: function(){
      return _showRead;
    },
    selectedEntry: function(){
      return _selectedEntry;
    },
    selectEntry: function(entry){
      _selectedEntry = entry;
    },

    getFeedEntries: function(feed,showRead){
      var qualifier = getEntriesQualifier(feed);
      $log.log('in getFeedEntries');
      if(!showRead){
        showRead=0;
      }
      _showRead=showRead;
      _isEntriesLoading = true;
      $http.get(ajaxurl+'?action=orbital_get_entries'+qualifier+'&show_read='+_showRead +'&sort=' +_sortOrder + '&orbital_actions_nonce=' + opts.orbital_actions_nonce)
      .success(function(data){
        _isEntriesLoading = false;
        data = _.union(_entries,data);
        data = _.unique(data,false, function(entry){return entry.entry_id;});
        _entries = data
        //scrollToEntry(_selectedEntry);
      });

    },

    /*
     * update this feed
     */
    update: function(feed){
      if( null == feed){
        feed = _selectedFeed;
      }
      //update feed
      var data= {
        orbital_actions_nonce: opts.orbital_actions_nonce,
        action: 'orbital_update_feed',
        feed_id: feed.feed_id,
      };
      $http.post(ajaxurl, data)
      .success(function(response){
        //refresh the feedlist
        feedservice.refresh();
        //refresh the feed if it is still selected
        if(feed == _selectedFeed){
          feedservice.select(feed, feedservice.showRead);
        }
      });
    },


    /*
     * Marks all the entries in a feed as read
     */
    markFeedRead: function(feed){
      if( null == feed){
        feed = _selectedFeed;
      }
      //mark feed read
      var data = {
        orbital_actions_nonce: opts.orbital_actions_nonce,
        action: 'orbital_mark_items_read',
        feed_id:feed.feed_id,
      };
      $http.post(ajaxurl, data)
      .success(function(response){
        feedservice.refresh();
        feedservice.select(feedservice.nextUnreadFeed());
      });
    },

    nextUnreadFeed: function(){
      // We should iterate through the feeds
      // Find our selected feed
      // Then keep iterating till we find an unread feed
      // If we reach the end of the list
      // Start looking at the beginning till we find an unread feed
      index = _feeds.indexOf(_selectedFeed);
      //we are starting at the index item
      //and circling the array
      for(i=(index+1)%_feeds.length;i!=index;i= (i+1)%_feeds.length){
        if(_feeds[i].unread_count >0){
          return _feeds[i];
        }
      }
      //NOTHING! let's just return where we started
      return _selectedFeed;
    },

    // get the list of feeds from backend, inject a "fresh" feed.
    refresh : function refresh(callback){
      _isLoading = true;
      $http.get(ajaxurl + '?action=orbital_get_feeds' + '&orbital_actions_nonce=' + opts.orbital_actions_nonce)
      .success( function( data ){
        //Here is our simple feed list
        data = _.map(data,
                     function(feed){
                       feed.is_private = feed['private']=='1';
                       feed.unreadCount= function(){return feed.unread_count;};
                       return feed;
                     });
        _feeds= data;

        //Now lets get a list of all the unique tags in those feeds
        _allTags = _.pluck(_feeds,'tags').join().split(",");
        _allTags = _.chain(_allTags)
                    .unique()
                    .compact()
                    .value();

        //For each tag, lets build up a list of the feeds that have that tag
        _.each(_allTags, function(tag){
          _tags[tag] = _.filter(_feeds,function(feed){
                          return _.contains(feed.tags.split(","),tag);
                        });
          _tags[tag].unreadCount = function(){
            return _.reduce(_tags[tag],
                          function(count, feed){
                            return count + parseInt(feed.unread_count,10);
                          },0);
          };
        });
        //We have to do this AFTER the tag building
        //because this has no tags and throws an exception
        var fresh = {
          feed_id:-1, //TODO start using neg integers for special feed ids
          feed_name:'All Feeds',
          unread_count:'',//TODO put in actual unread count;
          unreadCount: function(){
            var allNum = _.reduce(_feeds, function(memo, countFeed){
              if(countFeed.feed_id <0){return memo;}
              num = parseInt(countFeed.unread_count,10);
              return memo + num; }, 0);
            return allNum;
          },
          is_private:'1',
        }
        _feeds.unshift(fresh);

        _isLoading = false;
        //Should we do some extra work?
        if(callback){
          callback(_feeds);
        }
      });

      $http.get(ajaxurl + '?action=orbital_get_user_settings' + '&orbital_actions_nonce=' + opts.orbital_actions_nonce)
      .success(function(data){
        _sortOrder = data['sort_order'] || _sortOrder;
        _showByTags = data['show_by_tags'];
      });
    },
    select : function(feed, showRead){
      _selectedFeed = feed;
      _entries = [];
      _selectedEntry = null;
      if(undefined != showRead){
        _showRead = showRead;
      }
      this.getFeedEntries(feed,_showRead);
    },
    saveFeed: function(feed, successCallback){
      var data = {
        orbital_actions_nonce: opts.orbital_actions_nonce,
        action: 'orbital_save_feed',
        feed_id: feed.feed_id,
        feed_url: feed.feed_url,
        feed_name: feed.feed_name,
        site_url: feed.site_url,
        is_private: feed.is_private,
        tags: feed.tags,
      };
      $http.post(ajaxurl,data)
      .success(function(response){
        if(successCallback){ successCallback(response, data);}
        feedservice.refresh();
      });

    },
    getFeed: function(feed_id){
      return _.find(_feeds, function(feed){return feed.feed_id == feed_id});
    },
    getFeedFromEntry: function(entry){
      var feed_id = entry.feed_id;
      var feed = _.find(_feeds, function(feed){
        return feed.feed_id == feed_id}
      );
      if (feed){
        return feed;
      }else{
        return null;
      }

    },
    selectedFeed: function(){
      if(! _selectedFeed) {_selectedFeed = _feeds[0];}
      return _selectedFeed;
    },
    sortOrder: function(){
      return _sortOrder;
    },
    sortOptions: function(){
      return _sortOptions;
    },
    showByTags: function(){
      return _showByTags;
    },
    saveSetting: function(setting, callback){
      var data = {
        orbital_actions_nonce: opts.orbital_actions_nonce,
        action: 'orbital_set_user_settings',
        orbital_settings: setting ,
      };
      //console.log('And app thinks data is : ' + _sortOrder );
      $http.post(ajaxurl, data)
      .success(function(response){
        //Store the settings
        _showByTags = response['show_by_tags'] || _showByTags;
        _sortOrder = response['sort_order']|| _sortOrder;
        if(callback){
          callback();
        }
      });
    },
    saveSort: function(sortOrder, callback){
      feedservice.saveSetting({ sort_order: sortOrder },callback);
      feedservice.select(_selectedFeed )
    },
    saveTagView: function(showTags, callback){
      feedservice.saveSetting({show_by_tags:showTags},callback);
    },
    setEntryReadStatus: function(entry,status){
      entry.isLoading = true;
      var newReadStatus = status || (entry.isRead == 0?1:0);
      var data = {
        orbital_actions_nonce: opts.orbital_actions_nonce,
        action: 'orbital_mark_item_read',
        read_status: newReadStatus ,
        entry_id: entry.entry_id,
      };
      //Mark the entry read on the server
      $http.post(ajaxurl,data)
      .success(function(data){
        //mark the entry as read in the UI
        entry.isRead= entry.isRead == 0 ? 1:0;
        entry.isLoading = false;

        //tell the feed list that the entry was toggled read.
        feed = feedservice.getFeedFromEntry(entry);
        //decrement the feed read counter by the isread status
        feed.unread_count = Number(feed.unread_count ) + (entry.isRead ? -1:1);
      });

    },

    /*
     * feed a url to the backend for checking
     * We should see wither a feed response or a list of possible feeds at that url
     */
    checkUrl: function(urlIn,callback){
      //now we should check the candidate
      var data = {
        orbital_actions_nonce: opts.orbital_actions_nonce,
        action: 'orbital_find_feed',
        url: urlIn,
      };
      //ask the backend to look at it
      $http.post(ajaxurl,data)
      .success(function(response){
        callback(response);
      });
    },
    /*
     * unsubscribe from a feed
     */
    unsubscribe: function(feed, callback){
      var data = {
        orbital_actions_nonce: opts.orbital_actions_nonce,
        action: 'orbital_unsubscribe_feed',
        feed_id: feed.feed_id,
      };
      $http.post(ajaxurl,data)
      .success(function(response){
        callback(response);
      });

    },
  };
  return feedservice;
});

mainModule.run(function($rootScope){
  /*
   * receive the emitted messages and rebroadcast
   * use distinct event names to prevent browser explosion
   */
  $rootScope.$on('feedSelect',function(event, args){
    $rootScope.$broadcast('feedSelected',args);
  });
  $rootScope.$on('feedEdit',function(event, args){
    //Ugh, this should have a better name
    $rootScope.$broadcast('feedEditRequest',args);
  });
  //catch and broadcast entry changes
  $rootScope.$on('newFeedRequested', function(event,args){
    $rootScope.$broadcast('subscriptionsWindow',args);
  });
  $rootScope.$on('feedSaved', function(event,args){
    $rootScope.$broadcast('updateFeed',args);
  });
  $rootScope.$on('commandBarEvent',function(event,args){
    $rootScope.$broadcast('commandBarEvented', args);
  });
});
