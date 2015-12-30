var webchat = angular.module('webchat', ['ngRoute']).run(function($rootScope) {
    $rootScope.name = "";
    $rootScope.isLogin = false;

});

webchat.config(function($routeProvider) {
    $routeProvider.when('/login', {
        templateUrl: 'pages/login.html',
        controller: 'login-controller',
        controllerAs: 'login'
    })

    .otherwise({
        redirectTo: '/'
    });
});

webchat.controller("user-controller", ["$scope", "$rootScope", function($scope, $rootScope) {
    $scope.logout=function(){
        $rootScope.isLogin=false;
        $rootScope.name="";
        $rootScope.socket.disconnect();
    }
}]);

webchat.controller("login-controller", ["$scope", "$rootScope", "$location", function($scope, $rootScope, $location) {

    $scope.$watch(function() {
        return $location.path();
    }, function(val) {
        if ($rootScope.isLogin && val == "/login")
            $location.path("/");
    })
    $scope.join = function() {

        var user = $scope.username;
        if (user.length) {
            $rootScope.name = user.trim();
            $rootScope.isLogin = true;
            $rootScope.socket=io("http://localhost:3000");
            $rootScope.socket.connect("http://localhost:3000");
            $rootScope.socket.on('connect', function() {
                $rootScope.socket.emit('user', $rootScope.name);

            });
            $location.path("/");
        }
    }
    $scope.closePopup = function() {
        //window.location.href = "/";
        $location.path("/");
    }
}]);
