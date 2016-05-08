'use strict';

app.controller('MainWindowCtrl', function ($scope, socket) {
        $scope.profile = {name: '123'};
        $scope.profileMenuVisible = false;
        $scope.editOrderVisible = false;
        $scope.editFilterVisible = false;
        $scope.filterObj = {};

        $scope.items = [];
        $scope.getOrdersList = function () {
            if (socket.getStatus() == 0)
                setTimeout(()=> {
                    socket.send({sys: "getOrders"})
                }, 1000);
            else {
                console.log(socket.getStatus());
                socket.send({sys: "getOrders"})

            }
        };
        socket.on('getOrders', x=> {
            $scope.items = x.list;
        })

    socket.on('addOrder', x=> {
        $scope.items.push(x.item);
    })

    socket.on('updateOrder', x=> {
        $scope.items.some(i=>{
            if(i._id==x.item._id){
                i=x.item;
                return true;
            }
            return false;
        })
    })

    socket.on('delOrder', x=> {
        $scope.items.some((i,index)=>{
            if(i._id==x.item._id){
                $scope.items.splice(index,1);
                return true;
            }
            return false;
        })
    })

    }
);
    
    


