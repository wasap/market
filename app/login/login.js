'use strict';

app.controller('LoginCtrl', function (socket, $scope, $location) {
    socket.on('login', function listener(x) {
        console.log(x);
        if (x.error == null) {
            $location.path('/main.window');
        }
    });

    // socket.send({sys:'getList'})
    $scope.sendLogin = function () {
        socket.send({sys: 'login', name: $scope.login, password: $scope.password});
        // $location.path('/main.window')
    };
    $scope.login = '';
    $scope.password = '';
});
