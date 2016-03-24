﻿app.controller('editorController', function ($scope, notes, parts, focusOn, $element, $timeout) {
    $scope.windowId = 0;

    $scope.suggestions = {};
    $scope.showSuggestions = false;
    $scope.highlightedSuggestion = -1;
    $scope.currentNoteId = 0;
    //$scope.parts = [
    //    {
    //        Data: "new"
    //    }
    //];
    $scope.currentNoteObject = {};
    var timeoutUpdate; //setTimeout to update Part
    var editingPartOptions = {};
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    //$scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = "Normal"; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    //focusOn("smartBar"+$scope.windowId);

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

    $scope.editingPartKeyDown = function (event, partObjIndex) {

        //aktualizuj co jakis czas
        clearTimeout(timeoutUpdate);
        timeoutUpdate = setTimeout(function () { updatePart(partObjIndex) }, 1000);
        $scope.parts[partObjIndex].localState = "Sending";

    }

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        //timeout jest potrzebny, bo bez niego smartBar nie zdąży się zaktualizować
        $timeout(function () {
            if ($scope.smartBar == undefined) {
                $scope.smartBar = "";
            }
            console.log("getting parts" + $scope.smartBar);
            notes.getByTag($scope.smartBar).then(function (response) {
                console.log("getPartsByTag success response");
                //console.log("noteData");
                console.dir(response);
                //console.table(noteData);
                $scope.currentNoteId = response.data.NoteId;
                $scope.noteType = notes.typeToString(response.data.TypeOfNote);
                console.log("$scope.noteType" + $scope.noteType);
                //checkForSpecialTags($scope.smartBar);
                $scope.currentNoteObject = response.data;

                $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                    whenPartsReceived(data);
                });
            }, function (response) {
                console.log("getPartsByTag eror response");
                if (response.status == 404) {
                    //nie znaleziono notatki, mozna utworzyć nową
                    console.log("NIE ZNALEZIONO NOTATKI");
                    $scope.askToAddNewNote = $scope.smartBar;
                }
            });
        });
    }

    $scope.addPart = function () {
        var atIndex = $scope.activePart + 1;
        //console.log("atIndex: " + atIndex);

        $scope.parts.splice(atIndex, 0, { Data: "&nbsp;", NoteID: $scope.currentNoteId }); //add at index

        focusOn("part" + atIndex + "window" + $scope.$index); //przenieś kursor do nowego parta

        $scope.parts[atIndex].localState = "Sending";
        $scope.parts[atIndex].OrderPosition = $scope.parts[atIndex - 1].OrderPosition + 1;
        
        //to samo dzieje sie na serwerze
        for (var a in $scope.parts) {
            if (a != atIndex && $scope.parts[a].OrderPosition >= $scope.parts[atIndex].OrderPosition) {
                $scope.parts[a].OrderPosition++;
            }
        }

        parts.post($scope.parts[atIndex]).success(function (data) {
            $scope.parts[atIndex].ID = data.ID;
            $scope.parts[atIndex].localState = "OK";
            //console.dir($scope.parts);
            $scope.parts[atIndex].displayData = {};
            $scope.parts[atIndex].displayData.quickViewSetter = true;
            $scope.parts[atIndex].Settings = {};
        }).error(function () {
            $scope.parts[atIndex].localState = "Problem";
        });
    }

    function partsCheckForNull() {
        if ($scope.parts.length == 0 || $scope.parts == null) {
            $scope.addPart();
        }
    }

    function whenPartsReceived(data) {
        //console.log("Parts reeived");
        //console.dir(data);
        for (var p in data) {

            if (data[p].SettingsAsJSON == undefined) {
                data[p].Settings = {};
                //data[p].Settings["test"] = "aaaaa";
            }
            else {
                data[p].Settings = JSON.parse(data[p].SettingsAsJSON);
                //data[p].Settings = {};
                //data[p].Settings["test"] = "aaaaa";
                //data[p].Settings["test22"] = "bb";
            }

            data[p].displayData = {};
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

        $scope.parts = data;
        // console.log("scope Parts reeived");
        // console.table($scope.parts);
        //console.log("Got data: ");
        //console.table(data);
        partsCheckForNull();

        //rozwiązanie tymczasowe, tu trzeba ustawić czy wyświetlać tekst czy edytor
        //$scope.noteType = "text";
        //$scope.onePartNote = false;
        //    if (specialTagType == "code" || specialTagType == "c") {
        //        $scope.noteType = "javascript";
        //        $scope.onePartNote = true;
        //    }
        //    else if (specialTagType == "view" || specialTagType == "v") {
        //        $scope.noteType = "html";
        //        $scope.onePartNote = true;
        //    }
        //    else {
        //        $scope.noteType = "text";
        //        $scope.onePartNote = false;
        //    }

        //focusOn("part" + ($scope.parts.length - 1) + "window" + $scope.$index); //skocz do ostatniego utworzonego parta
    }

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    $scope.suggestionListCallback = function (noteId) {
        console.log("callback1");
        $scope.parts = {};
        $scope.askToAddNewNote = undefined;
        getPartsByTag();
    }

    $scope.addNote = function (name) {
        var newNote = {
            "TagsToAdd": name
        };

        notes.post(newNote).then(function (response) {
            $scope.askToAddNewNote = undefined;
            getPartsByTag(name);
        });
    }

    $scope.saveChangesToNote = function () {
        notes.put($scope.currentNoteObject).then(function (response) {
            console.log("saving note data success")
            $scope.smartBar = $scope.currentNoteObject.TagsToAdd;
            console.dir(response);
            console.log($scope.smartBar)
            getPartsByTag();
        });
    }

    $scope.deleteSetting = function (partIndex, settingName) {
        //console.log("pi: " + partIndex + " sn: " + settingName);
        //console.dir($scope.parts);
        delete $scope.parts[partIndex].Settings[settingName];
        $scope.editingPartKeyDown(null, $scope.activePart);
    }

    $scope.getViews = function () {
        //szybki wybór widoków do nowej części notatki
        //$scope.quickViewsContainer
        notes.getPopularViews().then(function (response) {
            if($scope.quickViewsContainer == [] || $scope.quickViewsContainer == null){
                $scope.quickViewsContainer = response.data;
            }
        });
    }

    $scope.setViewToPart = function (partIndex, viewTagi) {
        $scope.parts[partIndex].Settings["view"] = viewTagi + "";
        $scope.parts[partIndex].displayData.quickViewSetter = false;
        //console.dir($scope.parts[partIndex]);
        $scope.editingPartKeyDown(null, $scope.activePart);
    }
});