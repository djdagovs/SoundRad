'use strict';

/* Controllers */


angular.module('soundrad.controllers', [])


  .controller('PlayerCtrl', ['$scope', 'player', 'audio', function($scope, player, audio) {

    $scope.player = player;
    $scope.audio = audio;

  }])

  .controller('HeadCtrl', ['$scope', 'player', function($scope, player) {
    $scope.title = function() {
      if (player.playing) {
        return '► ' + player.tracks[player.i].title + ' | SoundRad';
      } else if (player.paused) {
        return player.tracks[player.i].title + ' | SoundRad';
      } else {
        return 'SoundRad';  
      };
    };
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
  
  .controller('NavCtrl',
    ['$scope', '$stateParams', '$state', '$window', '$location', '$route', 'soundcloud', 'storage',
    function($scope, $stateParams, $state, $window, $location, $route, soundcloud, storage) {
    
    $scope.version = storage.get('version');
    if(!$scope.version){
      console.log('Reseting localStorage - version 64');
      storage.clearAll();
      $scope.version = 64;
      storage.set('version', $scope.version);
    };
    if($scope.version != 64){
      console.log('Setting version to 64');
      localStorage.removeItem('bookmarks');
      $scope.version = 64;
      storage.set('version', $scope.version);
    };
    
    $scope.token = storage.get('token');
    $scope.me = storage.get('me');

    if ($scope.token){
      soundcloud.reconnect($scope.token);
      soundcloud.me(function(me){
        //console.log(me);
        $scope.me = me;
        $route.reload();
      });
    };

    $scope.connect = function() {
      soundcloud.connect(function(me){
        console.log(me);
        $scope.me = me;
        storage.set('me', me);
        $window.location.reload();
      });
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
      $location.hash('');
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
    
    $scope.viewUser = null;
    $scope.userData = null;

    $scope.page = 1;
    $scope.pageSize = 16;
    $scope.pageOffset = 0;

    $scope.getPage = function() {
      if ($location.hash() && !isNaN($location.hash())){
        $scope.page = parseFloat($location.hash());
        $scope.pageOffset = ($scope.page - 1) * $scope.pageSize;
      } else {
        $scope.page = 1;
        $scope.pageOffset = 0;
      };
      $scope.getParams = { limit: $scope.pageSize, offset: $scope.pageOffset };
    };
    $scope.getPage();

    //$scope.getParams = { limit: $scope.pageSize, offset: $scope.pageOffset };
    
  }])
  
  .controller('CallbackCtrl', ['$scope', '$window', '$timeout', function($scope, $window, $timeout){
    $timeout($window.opener.focus(), 500);
    if($scope.connectDebug == false){
      $timeout($window.close, 500);  
    };
  }])
  
  .controller('StreamCtrl', ['$scope', 'soundcloud', function($scope, soundcloud) {
    $scope.page = 1;
    $scope.scget = '/me/activities/tracks';
    soundcloud.getStream($scope);
  }])
  
  .controller('UserCtrl', ['$scope', 'soundcloud', '$stateParams', '$state', function($scope, soundcloud, $stateParams, $state) {
    $scope.contentLoading = true;
    $scope.viewUser = $stateParams.user;
    $scope.viewUsername = '.';
    soundcloud.getUser($scope.viewUser, function(data){
      $scope.$apply(function(){
        $scope.userData = data;
        $scope.viewUsername = data.username;
      });
    });
    
    $scope.$state = $state;

    $scope.getTracks = function(){
      soundcloud.getTracks($scope.scget, $scope.getParams, function(data){
        $scope.$apply(function(){
          $scope.tracks = data;
          $scope.hasPrevPage = ($scope.pageOffset >= $scope.pageSize);
          $scope.hasNextPage = ($scope.tracks.length >= $scope.pageSize);
          $scope.contentLoading = false;
        });
      });
    };
    
    $scope.$on('$stateChangeSuccess', function(){
      if ($state.current.name == 'user'){
        $scope.scget = '/users/' + $scope.viewUser + '/tracks';
        $scope.getPage();
        $scope.getTracks();
      };  
    });
    
  }])
  
  .controller('LikesCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
    $scope.tracks = null;
    $scope.contentLoading = true;
    $scope.scget = '/users/' + $scope.viewUser + '/favorites';
    $scope.getPage();
    // $scope.getTracks(); // not sure why tracks won't load from the parent controller
    soundcloud.getTracks($scope.scget, $scope.getParams, function(data){
      $scope.$apply(function(){
        $scope.tracks = data;
        $scope.hasPrevPage = ($scope.pageOffset >= $scope.pageSize);
        $scope.hasNextPage = ($scope.tracks.length >= $scope.pageSize);
        $scope.contentLoading = false;
      });
    });
  }])
  
  .controller('SetsCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
    $scope.tracks = null;
    $scope.contentLoading = true;
    $scope.scget = '/users/' + $scope.viewUser + '/playlists';
    $scope.getPage();
    soundcloud.getTracks($scope.scget, $scope.getParams, function(data){
      $scope.$apply(function(){
        $scope.tracks = data;
        $scope.hasPrevPage = ($scope.pageOffset >= $scope.pageSize);
        $scope.hasNextPage = ($scope.tracks.length >= $scope.pageSize);
        $scope.contentLoading = false;
      });
    });
  }])
  
  .controller('TrackDetailCtrl', ['$scope', 'soundcloud', '$stateParams', function($scope, soundcloud, $stateParams){
    $scope.contentLoading = true;
    if ($scope.preloadContent) {
      $scope.tracks = new Array($scope.preloadContent);
      $scope.track = $scope.preloadContent;
      $scope.preloadContent = null;
      $scope.contentLoading = false;
    };
    
    var path = '/' + $scope.viewUser + '/' + $stateParams.track;
    soundcloud.getTrack(path, function(data){
      $scope.$apply(function () {
        $scope.tracks = new Array(data);
        $scope.track = data;
        $scope.hasPrevPage = false;
        $scope.hasNextPage = false;
        $scope.contentLoading = false;
      });
    });
  }])
  
  .controller('SetDetailCtrl', ['$scope', 'soundcloud', '$stateParams', function($scope, soundcloud, $stateParams){
    $scope.contentLoading = true;
    if ($scope.preloadContent) {
      $scope.set = {};
      $scope.set.title = $scope.preloadContent.title;
      $scope.tracks = $scope.preloadContent.tracks;
      $scope.preloadContent = null;
      $scope.contentLoading = false;
    };
    var path = '/' + $scope.viewUser + '/sets/' + $stateParams.set;
    soundcloud.getSet(path, function(data){
      $scope.$apply(function () {
        $scope.set = data;
        $scope.tracks = data.tracks;
        $scope.hasPrevPage = false;
        $scope.hasNextPage = false;
        $scope.contentLoading = false;
      });
    });
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
    
    // Stream Pagination
    $scope.showMoreStream = function() {
      $scope.scget = $scope.streamNextPage;
      soundcloud.getStream($scope, true);
      $scope.page = $scope.page + 1;
    };
    
    // New Pagination
    $scope.updatePage = function(){
      $scope.page = ($scope.pageOffset + $scope.pageSize) / $scope.pageSize;
    };
    
    $scope.nextPage = function(){
      if($scope.hasNextPage){
        $scope.contentLoading = true;
        $scope.tracks = null;
        $scope.pageOffset = $scope.pageOffset + $scope.pageSize;
        $scope.getParams = { limit: $scope.pageSize, offset: $scope.pageOffset };
        soundcloud.getTracks($scope.scget, $scope.getParams, function(data){
          $scope.$apply(function(){
            $scope.tracks = data;
            $scope.hasPrevPage = ($scope.pageOffset >= $scope.pageSize);
            $scope.hasNextPage = ($scope.tracks.length >= $scope.pageSize);
            $scope.contentLoading = false;
          });
        });
        $scope.updatePage();
      };
    };
    
    $scope.prevPage = function(){
      if($scope.pageOffset >= $scope.pageSize) {
        $scope.contentLoading = true;
        $scope.tracks = null;
        $scope.pageOffset = $scope.pageOffset - $scope.pageSize;
        $scope.getParams = { limit: $scope.pageSize, offset: $scope.pageOffset };
        soundcloud.getTracks($scope.scget, $scope.getParams, function(data){
          $scope.$apply(function(){
            $scope.tracks = data;
            $scope.hasPrevPage = ($scope.pageOffset >= $scope.pageSize);
            $scope.hasNextPage = ($scope.tracks.length >= $scope.pageSize);
            $scope.contentLoading = false;
          });
        });
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
      'BLK': 'theme-blk',
      'Gray': 'theme-gray',
      'Slice': 'theme-slice'
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