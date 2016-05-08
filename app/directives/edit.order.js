/**
 * Created by q on 08.05.16.
 */
app.directive('editOrder', function () {
    return {
        restrict: 'E',
        scope: {
            editOrderVisible: '='
        },
        templateUrl: 'directives/edit.order.html',
        controller:function ($scope,socket) {
            $scope.type='sell';
            $scope.amount='';
            $scope.currency='';
            $scope.comment='';
            $scope.submit=function () {
                socket.send({sys:'addOrder',
                type:$scope.type,
                amount:$scope.amount,
                curr:$scope.currency,
                comment:$scope.comment
            })
                $scope.hide();
                $scope.amount='';
                $scope.currency='';
                $scope.comment='';
            }
            $scope.changeType=function () {
                $scope.type=='sell'?$scope.type='buy':$scope.type='sell';
            }
            
            $scope.hide=function () {
                $scope.$parent.editOrderVisible=false;
            }
        }
    };
})