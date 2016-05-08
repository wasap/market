/**
 * Created by q on 08.05.16.
 */
app.directive('editFilter', function () {
    return {
        restrict: 'E',
        scope: true,
        templateUrl: 'directives/edit.filter.html',
        controller:function ($scope) {
            $scope.type='';
            $scope.currency='';
            $scope.comment='';

            $scope.hide=()=>{
                $scope.$parent.editFilterVisible=false;
                $scope.$parent.filterObj.type=$scope.type;
                $scope.$parent.filterObj.currency=$scope.currency;
                $scope.$parent.filterObj.comment=$scope.comment;
            }

            $scope.removeFilter=()=>{
                $scope.type='';
                $scope.currency='';
                $scope.comment='';
                $scope.hide();
            }
        }
    };
})