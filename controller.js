			
var app = angular.module('KerbalTech', []);

app.controller('KerbalTechController', ['$scope', '$http', function($scope,$http)
{
	window.$scope = $scope;
	$scope.techs = {};
	$scope.activeTech = 'Start';

	$http.get('techs.json').then(function(res){
		$scope.techs = res.data;
	});

	$scope.sanitize = function(input){
		return input.replace(/\./, '');
	};
}]);

app.directive('kspZoomPan', function(){
	return {
		link: function($scope, elem, attrs)
		{
			elem = elem[0];
			var zoom = 100;

			elem.scrollLeft = 850;
			elem.scrollTop = 500;

			elem.addEventListener('wheel', function(evt)
			{
				evt.preventDefault();

				var center = [elem.scrollLeft+elem.clientWidth/2, elem.scrollTop+elem.clientHeight/2];
				zoom = Math.max(40, Math.min(200, evt.deltaY > 0 ? zoom-5 : zoom+5));

				elem.style.zoom = zoom + '%';
				elem.scrollLeft = center[0] - elem.clientWidth/2;
				elem.scrollTop = center[1] - elem.clientHeight/2;
			});


			var dragStart = null;
			elem.addEventListener('mousedown', function(evt){
				evt.preventDefault();
				dragStart = {
					x: evt.clientX,
					y: evt.clientY
				};
			});

			elem.addEventListener('mouseup', function(evt){
				dragStart = null;
			});

			elem.addEventListener('mousemove', function(evt){
				if(dragStart){
					elem.scrollLeft -= (100/zoom)*(evt.clientX-dragStart.x);
					elem.scrollTop -= (100/zoom)*(evt.clientY-dragStart.y);
					dragStart.x = evt.clientX;
					dragStart.y = evt.clientY;
				}
			});


		}
	}
});

app.directive('kspD', function(){
	return {
		link: function($scope, elem, attrs){
			attrs.$observe('kspD', function(newval){
				attrs.$set('d', newval);
			});
		}
	}
});
