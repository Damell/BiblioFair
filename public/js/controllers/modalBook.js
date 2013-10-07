var ModalBookCtrl = function ($scope, $modalInstance, $compile, $translate, book, APIservice) {
	$scope.details_view = book;
	$scope.remove = function () {
		$modalInstance.close('remove');
	};
	$scope.sendRequest = function (username) {
		console.log(username);
		APIservice.users.read(function(data) {
			APIservice.messages.send(username, data.email, data.username, book, function(data) {
				console.log('message sent');
			});
		});
	};
	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
	$scope.owners = [];
	$scope.draw_map = function()
	{
		var options={
			elt:document.getElementById('map'),       /*ID of element on the page where you want the map added*/ 
			zoom:2,                                  /*initial zoom level of the map*/ 
			latLng:{lat:30, lng:-30},   /*center of map in latitude/longitude */ 
			mtype:'map',                              /*map type (osm)*/ 
			bestFitMargin:0,                          /*margin offset from the map viewport when applying a bestfit on shapes*/ 
			zoomOnDoubleClick:true                    /*zoom in when double-clicking on map*/ 
		};
		$scope.map = new MQA.TileMap(options);
		APIservice.books.readById($scope.details_view._id, function(data) {
			console.log(data.users);
			for(var i = 0; i < data.users.length; i++) {
				if(data.users[i].loc.coordinates && data.users[i].loc.coordinates.length == 2 && data.users[i].loc.coordinates != [-30, 30]) {
					console.log(data.users[i]);
					console.log(data.users[i].loc.coordinates[1] + ' ' + data.users[i].loc.coordinates[0]);
					var point = new MQA.Poi( {lat: data.users[i].loc.coordinates[1], lng: data.users[i].loc.coordinates[0]} );
					//point.setRolloverContent('<button class="btn btn-success" ng-click="sendRequest()">' + $translate('HOME.MODAL.REQUEST') + '</button>');
					//point.setInfoContentHTML('<button class="btn btn-success" ng-click="sendRequest()">' + $translate('HOME.MODAL.REQUEST') + '</button>');
					//console.log($compile('<button class="btn" ng-click="sendRequest()">ahoj</button>')($scope)[0].outerHTML);
					point.setRolloverContent(data.users[i].username);
					$scope.owners.push(data.users[i].username);
					//point.setRolloverContent('<div request=""></div>');
					$scope.map.addShape(point);
				}
				$scope.map.bestFit(false, 4, 12);
			}
		});
	};
};