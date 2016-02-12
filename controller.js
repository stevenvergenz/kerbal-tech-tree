'use strict';

var app = angular.module('KerbalTech', []);

app.controller('KerbalTechController', ['$scope', '$http', function($scope,$http)
{
	window.$scope = $scope;
	$scope.techs = {};
	$scope.activeTech = 'Start';

	$scope.hoveringPart = null;

	$scope.purchases = [
		parseInt(window.location.hash.slice(-16,-8), 16) || 0,
		parseInt(window.location.hash.slice(-8), 16) || 0
	];

	$http.get('techs.json').then(function(res)
	{
		$scope.techs = res.data;

		for(var i in $scope.techs)
			$scope.techs[i].value = [
				parseInt($scope.techs[i].value.slice(-16,-8), 16) || 0,
				parseInt($scope.techs[i].value.slice(-8), 16) || 0
			];
	});

	$scope.$watchCollection('purchases', function(newval){
		if(window.location.hash || newval[0] || newval[1]){
			var part1 = ('00000000'+(newval[0]>>>16).toString(16)).slice(-4);
			var part2 = ('00000000'+(newval[0]&0xffff).toString(16)).slice(-4);
			var part3 = ('00000000'+(newval[1]>>>16).toString(16)).slice(-4);
			var part4 = ('00000000'+(newval[1]&0xffff).toString(16)).slice(-4);
			console.log(part1, part2, part3, part4);
			window.location.hash = '#'+part1+part2+part3+part4;
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

	$scope.totalSpent = function()
	{
		var total = 0;
		for(var i in $scope.techs){
			if($scope.isPurchased($scope.techs[i].value)){
				total += $scope.techs[i].cost;
			}
		}
		return total;
	}

	$scope.facilityRequired = function()
	{
		var max = 0;
		for(var i in $scope.techs){
			var tech = $scope.techs[i];
			if($scope.isPurchased(tech.value) && tech.cost > max){
				max = tech.cost;
			}
		}
		return max > 500 ? 3 : max > 100 ? 2 : 1;
	}

	$scope.showPartPopup = function(part, evt)
	{
		$scope.hoveringPart = part;

		var popup = document.getElementById('partTooltip');
		popup.style.display = 'block';
		popup.style.top = evt.clientY+'px';
	}

	$scope.hidePartPopup = function(evt)
	{
		var popup = document.getElementById('partTooltip');
		popup.style.display = '';
		
	}
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


			var dragInit = null;

			function dragStart(evt)
			{
				if(evt.preventDefault)
					evt.preventDefault();
				dragInit = {
					x: evt.clientX,
					y: evt.clientY
				};
			}

			function dragEnd(evt){
				dragInit = null;
			}

			function drag(evt){
				if(dragInit){
					offset[0] = Math.max(-1700, Math.min(1700, offset[0] + (evt.clientX - dragInit.x)/zoom));
					offset[1] = Math.max(-1000, Math.min(1000, offset[1] + (evt.clientY - dragInit.y)/zoom));
					update();

					dragInit.x = evt.clientX;
					dragInit.y = evt.clientY;
				}
			}

			elem.addEventListener('mousedown', dragStart);
			elem.addEventListener('mousemove', drag);
			elem.addEventListener('mouseup', dragEnd);

			elem.addEventListener('wheel', function(evt){
				evt.preventDefault();
				zoom = Math.max(0.3, Math.min(2, evt.deltaY > 0 ? zoom-0.05 : zoom+0.05));
				update();
			});

			var pinchDist = 0, origZoom = 0;
			elem.addEventListener('touchstart', function(evt){
				if(evt.touches.length === 1)
					dragStart(evt.touches[0]);
				else if(evt.touches.length >= 2){
					var t1 = evt.touches[0], t2 = evt.touches[1];
					origZoom = zoom;
					pinchDist = Math.sqrt( Math.pow(t1.clientX-t2.clientX,2) + Math.pow(t1.clientY-t2.clientY, 2) );
				}
			});

			elem.addEventListener('touchend', dragEnd);
			elem.addEventListener('touchcancel', dragEnd);
			elem.addEventListener('touchmove', function(evt){
				evt.preventDefault();
				if(evt.touches.length === 1){
					drag(evt.touches[0]);
				}
				else if(evt.touches.length >= 2){
					var t1 = evt.touches[0], t2 = evt.touches[1];
					var newPinchDist = Math.sqrt( Math.pow(t1.clientX-t2.clientX,2) + Math.pow(t1.clientY-t2.clientY, 2) );
					zoom = Math.max(0.3, Math.min(2, origZoom * (500+newPinchDist-pinchDist)*0.002));
					update();
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
