			
var app = angular.module('KerbalTech', []);

app.controller('KerbalTechController', ['$scope', '$http', function($scope,$http)
{
	window.$scope = $scope;
	$scope.techs = {};
	$scope.activeTech = null;

	$http.get('techs.json').then(function(res){
		$scope.techs = res.data;
	});

	$scope.sanitize = function(input){
		return input.replace(/\./, '');
	};
}]);

app.directive('dgyZoomPan', function(){
	return {
		link: function($scope, elem, attrs)
		{
			var zoom = 100;

			var style = window.getComputedStyle(elem[0]);
			var width = parseInt(style.width), height = parseInt(style.height);
			var center = [elem[0].scrollLeft+width/2, elem[0].scrollTop+height/2];

			elem[0].addEventListener('wheel', function(evt)
			{
				evt.preventDefault();
				zoom = Math.max(40, Math.min(200, evt.deltaY > 0 ? zoom-5 : zoom+5));
				elem[0].style.zoom = zoom + '%';
				elem[0].scrollLeft = center[0] - (zoom/100)*width/2;
				elem[0].scrollTop = center[1] - (zoom/100)*height/2;
				console.log(zoom, center, elem[0].scrollLeft, elem[0].scrollTop);
			});
		}
	}
});
