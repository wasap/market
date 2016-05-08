'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('myApp', [
        'ngRoute'
        // 'myApp.view1',
        // 'myApp.view2'
        // ,  'myApp.profileMenu'
    ])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/login', {
                templateUrl: 'login/login.html',
                controller: 'LoginCtrl'
            })
            .when('/main.window', {
                templateUrl: 'main.window/main.window.html',
                controller: 'MainWindowCtrl'
            })
            .otherwise({redirectTo: '/login'});
    }])
    .factory('socket', function ($rootScope) {
        var socket = new WebSocket(`ws://192.168.1.2:65533`);

        return {
            on: function (eventName, callback) {
                socket.addEventListener('message', function (data) {
                    // console.log(data)
                    var m = JSON.parse(data.data);
                    // console.log(m);
                    if (m.sys == eventName)
                        $rootScope.$apply(function () {
                            callback(m);
                        });
                });
            },
            send: function (data) {
                socket.send(JSON.stringify(data));
            },
            getStatus: function () {
                return socket.readyState;
            }
        };
    });
;
