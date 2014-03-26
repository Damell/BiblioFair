'use strict';
function welcomeControl($rootScope, $location, $scope, Books, Users, Utils, $translate) {

	//redirect to '/home' if signed in
	if($rootScope.authenticated && $location.path() === "/"){
		$location.path("/home");
	}

	$scope.usernameFromEmail = function() {
		if($scope.signup.email){
			$scope.signup.username = Utils.usernameFromEmail($scope.signup.email);
		}
	};

	/////////////////////
	$scope.bookOrder = 'title';

	//book count
	Books.count().success(function(data) {
		$scope.books_available = data;
	}).error(function(error) {
		console.log(error);
	});

	//initial books to show
	Books.get({limit: 6}).success(function(data) {
		$rootScope.books = data;
	});

	/**
	 * Retrieve (at maximum) 6 books based on search query.
	 */
	$scope.retrieveBooks = function() {
		Books.get({
			query: $scope.search_query,
			limit: 6
		}).success(function(data) {
			var arr = $rootScope.books.concat(data);
			$rootScope.books = uniqBooks(arr, function(a, b) {
				if(a._id < b._id)
					return -1;
				else if(a._id > b._id)
					return 1;
				else
					return 0;
			});
		});
	};

	/**
	 * Sign the user up.
	 * 
	 */
	$scope.signUp = function() {
		var user = angular.copy($scope.signup);
		Users.signUp({
			username: user.username,
			email: user.email,
			password: Utils.encrypt(user.password)
		}).success(function(data) {
			$scope.signupMessage = $translate('WELCOME.VERIFICATION_SENT') + user.email;
			//GA register goal
			ga('send', 'event', 'Register', 'register');
		}).error(function(errors) {
			if(errors[0].normalized){
				$scope.signupMessage = errors[0].message;
			}
			else{
				console.error(errors);
			}
		});
	};

	/**
	 * Google analytics.
	 */

	ga('send', 'pageview', '/');
}

