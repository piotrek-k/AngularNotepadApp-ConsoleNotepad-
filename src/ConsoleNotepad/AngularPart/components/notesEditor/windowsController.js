﻿app.controller('windowsController', function ($scope, notes, parts, focusOn, $timeout) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom
    $scope.activeWindow = 0;

    $scope.addWindow = function (index) {
        var newIndex = 0;
        //console.log("addWindow");
        if (index == undefined) {
            $scope.numberOfWindows.push($scope.preventDuplicates);
            newIndex = $scope.numberOfWindows.length - 1;
        }
        else
        {
            $scope.numberOfWindows.splice(index + 1, 0, $scope.preventDuplicates);
            newIndex = index + 1;
        }
        $scope.preventDuplicates++;
        $scope.activeWindow = newIndex;
        $scope.jumpToWindow(newIndex);
       
        //console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        if (index == undefined) {
            index = $scope.activeWindow;
        }
        $scope.numberOfWindows.splice(index, 1);
        $scope.jumpToWindow(index-1);
    }

    $scope.jumpToWindow = function (id) {
        console.log("Active window: " + $scope.activeWindow);
        console.log("id: " + id);
        if (id < $scope.numberOfWindows.length){
            $scope.activeWindow = id;
            $timeout(function () {
                focusOn("smartBar" + $scope.activeWindow);
            }); 
        }
        else {
            console.warn("Okno nie istnieje");
        }
    }
});