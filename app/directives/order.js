/**
 * Created by q on 08.05.16.
 */
app.directive('listItem', function () {
    return {
        restrict: 'E',
        scope: {
            item: '='
        },
        templateUrl: 'directives/order.html',
        controller: function ($scope,socket) {
            $scope.deleteOrder=function(order){
                socket.send({sys:'delOrder',id:order._id})
            }
        }
    };
});