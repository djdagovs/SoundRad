'use strict';

/* Controllers */


angular.module('soundrad.controllers', [])


  .controller('PlayerCtrl', ['$scope', 'player', 'audio', function($scope, player, audio) {
  
    $scope.player = player;
    $scope.audio = audio;

  }])
  
  .controller('ScrubberCtrl', ['$scope', 'audio', function($scope, audio) {
      function updateView() {
        $scope.$apply(function() {
          $scope.currentBufferPercentage = ((audio.buffered.length && audio.buffered.end(0)) / audio.duration) * 100;
          $scope.currentTimePercentage = (audio.currentTime / audio.duration) * 100;
          $scope.currentTimeMS = (audio.currentTime * 1000).toFixed();
          $scope.durationMS = (audio.duration * 1000).toFixed();
        });
      };  
      audio.addEventListener('timeupdate', updateView, false);
      $scope.seekTo = function($event){
        var xpos = $event.offsetX / $event.target.offsetWidth;
        audio.currentTime = (xpos * audio.duration);
      };
  }])
  
  .controller('NavCtrl', ['$scope', '$stateParams', '$state', '$window', '$location', 'soundcloud', 'storage', function($scope, $stateParams, $state, $window, $location, soundcloud, storage) {
    
    console.log('navctrl');
    
    $scope.version = storage.get('version');
    
    if(!$scope.version){
      console.log('Reseting localStorage - version 16');
      storage.clearAll();
      $scope.version = 16;
      storage.set('version', $scope.version);
    };
    
    $scope.token = storage.get('token');
    $scope.me = storage.get('me');
    
    $scope.bookmarks = storage.get('bookmarks');

    if ($scope.token){
      soundcloud.connect($scope);
    };
    
    $scope.connect = function() {
      soundcloud.connect($scope);
    };
    
    $scope.logOut = function() {
      storage.clearAll();
      $window.location.href = '/';
    };
    
    $scope.$stateParams = $stateParams;
    
    $scope.$on('$stateChangeSuccess', function(){
      $scope.currentState = $state.current.name;
      $scope.viewUser = $stateParams.user;
    });

    $scope.preloadContent = null;
    $scope.preload = function(url, data) {
      $location.path(url);      
      $scope.preloadContent = data;
    };
    
    $scope.connectDebug = storage.get('connectDebug');
    
    if(!$scope.connectDebug){
      $scope.connectDebug = false;
      storage.set('connectDebug', $scope.connectDebug);
    };
    
    $scope.toggleDebug = function() {
      $scope.connectDebug = !$scope.connectDebug;
      storage.set('connectDebug', $scope.connectDebug);
    };
    
    $scope.debugConnect = function() {
      console.log('debug connect');
      $scope.connectDebug = true;
      storage.set('connectDebug', $scope.connectDebug);
      $scope.connect();
    };
    
    
    //$scope.viewUser = $stateParams.user;
    $scope.viewUser = null;
    $scope.userData = null;

    if ($location.hash() && !isNaN($location.hash())){
      $scope.page = parseFloat($location.hash());
      $scope.pageSize = 16;
      $scope.pageOffset = $scope.page * $scope.pageSize;
      // Need to reload scope.tracks here
      
    };
    
    
  }])
  
  .controller('ListCtrl', ['$scope', 'storage', function($scope, storage) {
    
    $scope.listIsEditable = false;
    
    $scope.toggleListIsEditable = function() {
      $scope.listIsEditable = !$scope.listIsEditable;
    };
    
  }])
  
  .controller('CallbackCtrl', ['$scope', '$window', '$timeout', function($scope, $window, $timeout){
    $timeout($window.opener.focus(), 500);
    if($scope.connectDebug == false){
      $timeout($window.close, 500);  
    };
    
  }])
  
  .controller('BookmarkCtrl', ['$scope', 'storage', function($scope, storage){
    
    // Started to set up a factory
    //$scope.bookmarks = bookmarkService;

    //$scope.bookmarks = storage.get('bookmarks');
    
    if (!$scope.bookmarks) {
      $scope.bookmarks = [
        { 'title': 'Jxnblk', 'url': '/jxnblk' },
        { 'title': 'Mrsjxn', 'url': '/mrsjxn' },
        { 'title': 'MrMrs', 'url': '/mr_mrs' },
        { 'title': 'XLR8R', 'url': '/xlr8r' },
        { 'title': 'Ghostly', 'url': '/ghostly' },
        { 'title': 'SSENSE', 'url': '/ssense' },
        { 'title': 'FACT Magazine', 'url': '/factmag' }
      ];
      storage.set('bookmarks', $scope.bookmarks);
    };
    
    $scope.removeBookmark = function(i) {
      $scope.bookmarks.splice(i,1);
      storage.set('bookmarks', $scope.bookmarks);
    };
    
    $scope.addBookmark = function() {
      $scope.newBookmark = { 'title': $scope.viewUsername, 'url': '/' + $scope.viewUser };
      $scope.bookmarks.push($scope.newBookmark);
      storage.set('bookmarks', $scope.bookmarks);
    };
    
    $scope.isBookmarked = false;
    
    for (var i = 0; i < $scope.bookmarks.length; i++) {
      if ($scope.bookmarks[i].url == '/' + $scope.viewUser) {
        $scope.isBookmarked = true;
      };
    };
    
    
  }])
  
  .controller('StreamCtrl', ['$scope', 'soundcloud', function($scope, soundcloud) {
    $scope.scget = '/me/activities/tracks';
    $scope.pageSize = 16;
    soundcloud.getStream($scope);
  }])
  
  .controller('UserCtrl', ['$scope', 'soundcloud', '$stateParams', '$state', function($scope, soundcloud, $stateParams, $state) {
    $scope.contentLoading = true;
    $scope.pageSize = 16;
    $scope.viewUser = $stateParams.user;
    $scope.viewUsername = '.';
    soundcloud.getUser($scope);
    
    $scope.$state = $state;
    
    $scope.$on('$stateChangeSuccess', function(){
      if ($state.current.name == 'user'){
        $scope.scget = '/users/' + $scope.viewUser + '/tracks';
        soundcloud.getTracks($scope);  
      };  
    });
    
  }])
  
  .controller('LikesCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
    $scope.contentLoading = true;
    $scope.scget = '/users/' + $scope.viewUser + '/favorites';
    soundcloud.getTracks($scope);
  }])
  
  .controller('SetsCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
    $scope.contentLoading = true;
    $scope.scget = '/users/' + $scope.viewUser + '/playlists';
    // Use smaller pageSize
    $scope.pageSize = 8;
    soundcloud.getTracks($scope); 
  }])
  
  .controller('TrackDetailCtrl', ['$scope', 'soundcloud', '$stateParams', function($scope, soundcloud, $stateParams){
    $scope.contentLoading = true;
    if ($scope.preloadContent) {
      $scope.tracks = new Array($scope.preloadContent);
      $scope.track = $scope.preloadContent;
      $scope.preloadContent = null;
      $scope.contentLoading = false;
    };
    
    $scope.urlPath = '/' + $scope.viewUser + '/' + $stateParams.track;
    soundcloud.getTrack($scope);
  }])
  
  .controller('SetDetailCtrl', ['$scope', 'soundcloud', '$stateParams', function($scope, soundcloud, $stateParams){
    //console.log('set detail ctrl');
    $scope.contentLoading = true;
    if ($scope.preloadContent) {
      $scope.set = {};
      $scope.set.title = $scope.preloadContent.title;
      $scope.tracks = $scope.preloadContent.tracks;
      $scope.preloadContent = null;
      $scope.contentLoading = false;
    };
    $scope.urlPath = '/' + $scope.viewUser + '/sets/' + $stateParams.set;
    soundcloud.getSet($scope);
  }])
  
  .controller('InfoCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
    
  }])
  
  .controller('FollowingCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
    $scope.contentLoading = true;
    soundcloud.getFollowings($scope, $scope.viewUser);
    $scope.sorts = [
      { json: 'followers_count', human: 'Popularity', reverse: true },
      { json: 'username', human: 'Alphabetical', reverse: false }
    ];
    $scope.sortFollowings = $scope.sorts[0];  
  }])
  
  .controller('FollowersCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
    $scope.contentLoading = true;
    soundcloud.getFollowers($scope, $scope.viewUser);
    $scope.sorts = [
      { json: 'followers_count', human: 'Popularity', reverse: true },
      { json: 'username', human: 'Alphabetical', reverse: false }
    ];
    $scope.sortFollowers = $scope.sorts[0];
  }])
  
  .controller('TracklistCtrl', ['$scope', '$location', '$anchorScroll', 'soundcloud', 'player', function($scope, $location, $anchorScroll, soundcloud, player) {

    $scope.player = player;    
    
    // if ($location.hash() && !isNaN($location.hash())){
    //   $scope.page = parseFloat($location.hash());
    //   $scope.pageOffset = $scope.page * $scope.pageSize;
    //   console.log('pageoffset: ' + $scope.pageOffset);
    // } else {
    if (!$scope.page) {
      $scope.page = 1;
      $scope.pageOffset = 0; 
    };
    
    console.log('tracklistctrl page number: ' + $scope.page);
    
    // Stream Pagination
    $scope.showMoreStream = function() {
      $scope.scget = $scope.streamNextPage;
      soundcloud.getStream($scope, true);
      $scope.page = $scope.page + 1;
      console.log($scope.page);
    };
    
    // New Pagination
    $scope.updatePage = function(){
      $scope.page = ($scope.pageOffset + $scope.pageSize) / $scope.pageSize;
    };
    
    $scope.nextPage = function(){
      if($scope.hasNextPage){
        $scope.contentLoading = true;
          // Trying this to clear content when changing pages
          $scope.tracks = null;
        $scope.pageOffset = $scope.pageOffset + $scope.pageSize;
        soundcloud.getTracks($scope);
        $scope.updatePage();
      };
    };
    
    $scope.prevPage = function(){
      if($scope.pageOffset >= $scope.pageSize) {
        $scope.contentLoading = true;
        $scope.tracks = null;
        $scope.pageOffset = $scope.pageOffset - $scope.pageSize;        
        soundcloud.getTracks($scope);  
        $scope.updatePage(); 
      };      
    };
        
  }])
  
  .controller('TrackCtrl', ['$scope', 'soundcloud', function($scope, soundcloud) {
    
      $scope.showActions = false;
      $scope.toggleActions = function() {
        $scope.showActions = !$scope.showActions;
      };
    
      $scope.like = function(trackid, params) {        
        if(params == 'isSetTrack') {
          $scope.setTrack.user_favorite = true;
        } else {
          $scope.track.user_favorite = true;
        };
        if($scope.token){
          soundcloud.like($scope, trackid);  
        } else {
          $scope.connect();
        };
      };
      $scope.unlike = function(trackid, params) {
        if(params == 'isSetTrack') {
          $scope.setTrack.user_favorite = false;
        } else {
          $scope.track.user_favorite = false;
        };
        soundcloud.unlike($scope, trackid);
      };
      
      
  }])
  
  .controller('ThemeCtrl', ['$scope', 'storage', function($scope, storage) {
    
    $scope.themes = {
      'Default': 'theme-default',
      'Science': 'theme-science',
      'BLK': 'theme-blk'
    };
    
    $scope.changeTheme = function(name) {
      $scope.theme = $scope.themes[name];
      storage.set('theme', name);
    };
    
    $scope.savedTheme = storage.get('theme');
    if ($scope.savedTheme) {
      $scope.changeTheme($scope.savedTheme);
    } else {
      $scope.changeTheme('Default');  
    };
    
  }])
  
  .controller('QueueCtrl', ['$scope', 'player', function($scope, player) {
    
    $scope.tracks = player.tracks;
    
  }])
  
  .controller('ModalCtrl', ['$scope', function($scope) {
    
  }])

;