			
var app = angular.module('KerbalTech', []);

app.controller('KerbalTechController', ['$scope', '$http', function($scope,$http)
{
	window.$scope = $scope;
	$scope.techs = {};
	$scope.activeTech = 'Start';
	$scope.purchases = [
		parseInt(window.location.hash.slice(-16,-8), 16) || 0,
		parseInt(window.location.hash.slice(-8), 16) || 0
	];

	$http.get('techs.json').then(function(res){
		$scope.techs = res.data;
		for(var i in $scope.techs)
			$scope.techs[i].value = [
				parseInt($scope.techs[i].value.slice(-16,-8), 16) || 0,
				parseInt($scope.techs[i].value.slice(-8), 16) || 0
			];
	});

	$scope.$watchCollection('purchases', function(newval){
		if(window.location.hash || newval[0] || newval[1]){
			var part1 = ('0000000'+newval[0].toString(16)).slice(-8);
			var part2 = ('0000000'+newval[1].toString(16)).slice(-8);
			window.location.hash = '#'+part1+part2;
		}
	});

	$scope.sanitize = function(input){
		return input.replace(/\./, '');
	};

	$scope.isPurchased = function(val){
		if(val){
			return $scope.purchases[0] & val[0] || $scope.purchases[1] & val[1];
		}
		else return false;
	};

	$scope.togglePurchase = function(val){
		$scope.purchases[0] = $scope.purchases[0] ^ val[0];
		$scope.purchases[1] = $scope.purchases[1] ^ val[1];
	};

	$scope.isAvailable = function(tech)
	{
		if(tech){
			var dep1met = tech.dependencies[0] && $scope.isPurchased($scope.techs[tech.dependencies[0]].value);
			var dep2met = tech.dependencies[1] && $scope.isPurchased($scope.techs[tech.dependencies[1]].value);
			return !$scope.isPurchased(tech.value) && (
				tech.dependencies.length === 0
				|| dep1met
				|| dep2met
				|| tech.allDepsRequired && dep1met && dep2met
			);
		}
		else return false;
	};

}]);

app.directive('kspZoomPan', function(){
	return {
		link: function($scope, elem, attrs)
		{
			elem = elem[0];
			var fieldCenter = [1700,1000];

			var zoom = 1;
			var offset = [(fieldCenter[0]-elem.clientWidth)/2,0];

			function update()
			{
				var diff = [fieldCenter[0]-elem.clientWidth/2, fieldCenter[1]-elem.clientHeight/2];
				// transforms applied top to bottom
				elem.children[0].style.transform = 
					'translate('+-diff[0]+'px,'+-diff[1]+'px) '+
					'scale('+zoom+') '+
					'translate('+offset[0]+'px,'+offset[1]+'px) '+
					'';
			}
			update();

			elem.addEventListener('wheel', function(evt)
			{
				evt.preventDefault();
				zoom = Math.max(0.4, Math.min(2, evt.deltaY > 0 ? zoom-0.05 : zoom+0.05));
				update();
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
					offset[0] = Math.max(-1700, Math.min(1700, offset[0] + (evt.clientX - dragStart.x)/zoom));
					offset[1] = Math.max(-1000, Math.min(1000, offset[1] + (evt.clientY - dragStart.y)/zoom));
					update();

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

var modal = null;
var animLength = 100;

function about()
{
	if(!modal) modal = document.getElementById('modal');

	modal.style.opacity = 0;
	modal.style.display = '';
	var starttime = Date.now();

	var finished = setInterval(function(){
		var curtime = Date.now();
		if(curtime < starttime+animLength)
			modal.style.opacity = (curtime-starttime)/animLength;
		else {
			modal.style.opacity = 1;
			clearInterval(finished);
		}
	}, 0);
}
function okay()
{
	modal.style.opacity = 1;
	var starttime = Date.now();

	var finished = setInterval(function(){
		var curtime = Date.now();
		if(curtime < starttime+animLength)
			modal.style.opacity = 1-((curtime-starttime)/animLength);
		else {
			modal.style.opacity = 0;
			modal.style.display = 'none';
			clearInterval(finished);
		}
	}, 0);
}
