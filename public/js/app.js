var myApp = angular.module('myApp', ['ui.bootstrap', 'pascalprecht.translate']);

myApp.config(['$routeProvider', '$locationProvider', '$httpProvider', '$provide', '$translateProvider', function($routeProvider, $locationProvider, $httpProvider, $provide, $translateProvider) {
	$routeProvider
	.when('/', {templateUrl: '/partials/home.html',   controller: homeControl})
	.when('/login', {templateUrl: '/partials/welcome.html',   controller: welcomeControl})
	.when('/library', {templateUrl: '/partials/library.html',   controller: libraryControl})
	.when('/account', {templateUrl: '/partials/account.html',   controller: accountControl})
	.when('/messages', {templateUrl: '/partials/messages.html',   controller: messagesControl})
	.otherwise({redirectTo: '/'});
	$locationProvider.html5Mode(true).hashPrefix('!');
	$provide.factory('myHttpInterceptor', function($q, $location, $rootScope) {
		return {
			'response': function(response) {
				return response || $q.when(response);
			},
			'responseError': function(rejection) {
				var status = rejection.status;
				if (status == 401) {
					$rootScope.redirect = $location.url(); // save the current url so we can redirect the user back
					$location.path('/login');
					$location.replace();
				}
				return $q.reject(rejection);
			}
		};
	});
	$httpProvider.interceptors.push('myHttpInterceptor');
	$translateProvider.translations('en', translateEN);
	$translateProvider.translations('cz', translateCZ);
	$translateProvider.preferredLanguage('en');
}]);
myApp.run(function ($rootScope, $http, $location, $translate, APIservice) {
	$rootScope.books = [];
	$rootScope.mybooks = [];
	$rootScope.user = {};

	$http.get('/user')
	.success(function (data) {
		$rootScope.user = data;
	})
	.error(function (data) {
		$location.path('/login');
	});

	$rootScope.logout = function () {
		$rootScope.user = {};
		APIservice.users.del(function(data) {
			$location.path('/login');
		});
	};
	$rootScope.collapse = function () {
		$rootScope.isCollapsed = $('.navbar-toggle').css("display") == 'none';
	};
	window.onresize = function () {$rootScope.collapse();$rootScope.$apply();};
	$rootScope.changeLanguage = function (langKey) {
		$translate.uses(langKey);
	};
});
