			
var app = angular.module('KerbalTech', []);

app.controller('KerbalTechController', ['$scope', '$http', function($scope,$http)
{
	window.$scope = $scope;
	$scope.techs = {};
	$scope.activeTech = 'Start';
	$scope.purchased = parseInt(window.location.hash.slice(1), 16) || 0;

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
