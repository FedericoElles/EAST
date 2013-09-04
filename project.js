
fritzify('east')
fritzend.restore()
fritzend.restore('suggestions')


var app = angular.module('project',['fritzmod']).
  config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:ListCtrl, templateUrl:'list.html'}).
      when('/demo', {controller:ListCtrl, templateUrl:'list.html'}).
      when('/tastekid/:id', {controller:TastekidDetailCtrl, templateUrl:'tastekiddetail.html'}).
      when('/tastekid', {controller:TastekidCtrl, templateUrl:'tastekid.html'}).
      when('/edit/:projectId', {controller:EditCtrl, templateUrl:'detail.html'}).
      when('/new/:name', {controller:CreateCtrl, templateUrl:'detail.html'}).
      otherwise({redirectTo:'/'});
  });
 
app.config(function($compileProvider){
  $compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
});


app.filter('capitalizefirst',
  function() {
    return function(input) {
      if(angular.isString(input) && input.length){
        return input.charAt(0).toUpperCase() + input.slice(1);
      }
      return input;
    };
  }
);


app.run(function($rootScope, $http, $location) {
  $rootScope.test = 'Hallo World'
  
  var uniqueID = 
  $rootScope.player = {"id":'' + (new Date()).getTime()}
  var player = localStorage.getItem('player')
  if (player) $rootScope.player = JSON.parse(player)


})

// ----------------- //
// TASTEKID API LIST //
// ----------------- //
function TastekidCtrl($scope, $location, $routeParams, $http) {
  actionbar.goPage('','Suggestions by TasteKid')

  $scope.suggestions = {'results':[]}
  $scope.error = false
  $scope.nothingfound = false


  
  var stageSuggestions = fritzend.getAll('suggestions');


  //LOAD SUGGESTIONS FROM TASTEKID
  $scope.loadSuggestions = function(){
    $scope.projects = fritzend.getAll();

    var shows = []
    var showObj = {}
    for (var i = 0,ii=$scope.projects.length;i<ii;i++){
      shows.push($scope.projects[i].name)
      showObj[$scope.projects[i].name] = true
    }
  
    var url = "http://www.tastekid.com/ask/ws?verbose=1&q=show:"+shows.join(',')+"//shows&f=episode7232&k=ntiyndczmziw&format=JSON&jsonp=JSON_CALLBACK"

  
    $http({method: 'JSONP', url: url}).
      success(function(data, status, headers, config) {
        console.log('jsonp',data)
        if (data.Similar.Results.length <1)   $scope.nothingfound = true
        $scope.suggestions = {'results':data.Similar.Results}
        fritzend.add($scope.suggestions,'suggestions')
      }).
      error(function(data, status, headers, config) {
        $scope.error = true
      });
  }//END LOAD
  

  if (stageSuggestions.length > 0){
    console.log('stageSuggestions',stageSuggestions[0])
    $scope.suggestions = stageSuggestions[0]
  } else {
    $scope.loadSuggestions()
  }

  //LOAD NEW RESULTS
  $scope.reload= function(){
    $scope.suggestions = {'results':[]}
    //delete all suggestions
    var toBeDeleted = fritzend.getAll('suggestions');
    for (var i=0,ii=toBeDeleted.length;i<ii;i+=1){
      fritzend.del(toBeDeleted[i]._id,'suggestions')
    }
    
    $scope.loadSuggestions()
  }

  //GO TO DETAIL VIEW
  $scope.detail = function(id){
    $location.path('/tastekid/'+id);
  }

  //ADD NEW SHOW
  $scope.add = function(name,index){
    var oProject={'name':name,'season':1,'episode':1}
    $scope.suggestions.results[index].added = true
    project = fritzend.add(oProject)
    fritzend.update($scope.suggestions,'suggestions') 
  }
  

}

// --------------------- //
// TASTEKID DETAILS VIEW //
// --------------------- //
function TastekidDetailCtrl($scope, $location, $routeParams) {
  $scope.yImage = 0
  var stageSuggestions = fritzend.getAll('suggestions')
  $scope.suggestions = stageSuggestions[0]
  if ($routeParams.id){
    $scope.id = parseInt($routeParams.id)
  }
  $scope.suggestion = $scope.suggestions.results[$scope.id]
  actionbar.goPage('','Suggestion: '+$scope.suggestion.Name)

  console.log('Suggestion',$scope.suggestion)

  //ADD NEW SHOW
  $scope.add = function(name){
    var oProject={'name':name,'season':1,'episode':1}
    $scope.suggestions.results[$scope.id].added = true
    project = fritzend.add(oProject)
    fritzend.update($scope.suggestions,'suggestions') 
  }

}

// --------- //
// LIST VIEW //
// --------- // 
function ListCtrl($scope, $location, $routeParams) {
  $scope.projects = fritzend.getAll();
  $scope.weekdays =  ['Sunday','Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']


  //loop projects and add meta info
  for (var i = 0,ii=$scope.projects.length;i<ii;i++){
    var project = $scope.projects[i]
    if (typeof project.updated != 'undefined') {
      if (typeof project.updated  == "string") project.updated = new Date(project.updated )
      var lastSaw = daysBetween(truncDate(project.updated),getNow() )
      $scope.projects[i].lastSaw = lastSaw
      //nextEpisode
    }
    if (typeof project.weekday != 'undefined') {
      var day = new Date().getDay()
      $scope.projects[i].nextEpisode = project.weekday - day
    }
  }

  if ($location.$$url == '/demo'){
    $scope.projects = fritzend.demo(
     {"1":{"season":4,"episode":12,"name":"Dexter","_id":1,"$$hashKey":"005"},"2":{"season":1,"episode":5,"name":"Elementary","_id":2,"$$hashKey":"00G"},"4":{"season":7,"episode":1,"name":"Bones","_id":4,"$$hashKey":"004"},"5":{"name":"Tron Uprising","season":1,"episode":5,"_id":5,"$$hashKey":"00O"},"6":{"season":2,"episode":1,"name":"Person of Interest","_id":6,"$$hashKey":"00Q"},"7":{"name":"Tengen Toppen Gurren Lagan","season":1,"episode":12,"_id":7,"$$hashKey":"00V"}}
    )
  }

  actionbar.goHome()

  $scope.$watch('projects', function(newval, oldval) {
    for (x in newval){
      if (newval[x].episode != oldval[x].episode){
        newval[x].updated = new Date()
        fritzend.update(newval[x]) 
      }
    }
  },true);
}
 
 
function CreateCtrl($scope, $location, $routeParams, $filter) {
  $scope.project = {}
  $scope.once = 2

  if ($routeParams.name){
    $scope.project.name = $routeParams.name
  }
  $scope.project.season = 1
  $scope.project.episode = 1

  actionbar.goPage('','New Show')

  $scope.$watch('project.name', function(newval, oldval) {
    if ($scope.once>0) {
      $scope.project.name = $filter('capitalizefirst')($scope.project.name);
      $scope.once -=1
    } 
  },false);
  
  $scope.save = function() {
    project = fritzend.add($scope.project)
    $location.path('/list');
   
  }
}
 
// ---- //
// EDIT //
// ---- //
function EditCtrl($scope, $location, $routeParams) {
  $scope.days={'-1':'Off','0':'Sunday','1':'Monday','2':'Tuesday','3':'Wednesday','4':'Thursday','5':'Friday','6':'Saturday'}

  var self = this;
  $scope.project = fritzend.get($routeParams.projectId)
  $scope.scheduling = false
  if (typeof $scope.project.weekday != "undefined"){
    console.log('ini',$scope.project.weekday)
    if ($scope.project.weekday > -1) $scope.scheduling = true
  }

  actionbar.goPage('','Edit Show')

  //$scope.$watch('project.weekday', function(newval, oldval) {
    //if (newval == 7) $scope.project.weekday=0
    //if (newval < -1) $scope.project.weekday=6
  //},false);
  
  $scope.prevDay = function(){
    $scope.project.weekday = ($scope.project.weekday == 0) ? 6 : ($scope.project.weekday-1)
  }

  $scope.isClean = function() {
    return angular.equals(self.original, $scope.project);
  }
 
  $scope.destroy = function() {
    if (confirm('Really delete "'+$scope.project.name+'"?')){
      fritzend.del($scope.project._id)
      $location.path('/list');
    }
    
  };
 
  $scope.save = function() {
    fritzend.update($scope.project) 
    $location.path('/');
  };

  $scope.increaseEpisode=function(){
    $scope.project.updated = new Date()
  }

  $scope.nextSeason = function(){
    $scope.project.updated = new Date()
    $scope.project.season +=1
    $scope.project.episode = 1
  }
}

// HELP FUNCTIONS //
function daysBetween(first, second) {

    // Copy date parts of the timestamps, discarding the time parts.
    var one = new Date(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate());
    var two = new Date(second.getUTCFullYear(), second.getUTCMonth(), second.getUTCDate());

    // Do the math.
    var millisecondsPerDay = 1000 * 60 * 60 * 24;
    var millisOne = one.getTime()
    var millisTwo = two.getTime()
    var diff = (two.getTimezoneOffset() - one.getTimezoneOffset())

    //if (one.getTimezoneOffset() < two.getTimezoneOffset()){
      
    //}


    var millisBetween = millisTwo - millisOne 
    var days = millisBetween / millisecondsPerDay;
    //console.log('days between',days,one.getTimezoneOffset(),two.getTimezoneOffset())  
    // Round up due to possible timeout differences//down.
    return Math.round(days); //Math.floor(days);
}

var truncDate = function(date){
  var d = new Date(date.getFullYear(),date.getMonth(),date.getDate())
  return d
}

var getNow = function(){
  var date = new Date()
  var d = new Date(date.getFullYear(),date.getMonth(),date.getDate())
  return d
}