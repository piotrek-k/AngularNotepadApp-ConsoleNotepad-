﻿app.controller('editorController', function ($scope, notes, parts, focusOn) {
    $scope.suggestions = {};
    $scope.showSuggestions = false;
    $scope.highlightedSuggestion = -1;
    $scope.currentNoteId = 0;
    $scope.parts = [
        {
            Data: "new"
        }
    ];
    var timeoutUpdate; //setTimeout to update Part
    var editingPartOptions = {};
    $scope.focusOnPart = 0;

    getPartsByTag();
    focusOn("smartBar");

    $scope.smartBarKeyDown = function (event) {
        //console.log("Refresh " + event.keyCode)
        if (event.keyCode == 32) { //space
            $scope.suggestions = notes.getSuggested($scope.smartBar).success(function (data) {
                console.table(data);
                $scope.suggestions = data;
            });
            console.log("Suggestions refreshed");
        }

        if (event.keyCode == 40 && $scope.highlightedSuggestion < $scope.suggestions.length - 1) { //arrow down
            //sterowanie po menu
            event.preventDefault();
            $scope.highlightedSuggestion++;
        }
        else if (event.keyCode == 38 && $scope.highlightedSuggestion > -1) { //arrow up
            event.preventDefault();
            $scope.highlightedSuggestion--;
        }
        else if (event.keyCode == 13) { //enter // && $scope.highlightedSuggestion > -1
            //uzupełnij inputa, zacznij pisanie notatki
            //console.table($scope.suggestions[$scope.highlightedSuggestion].NoteTags);

            if ($scope.highlightedSuggestion != -1) {
                oneOfSuggestionsChosen($scope.highlightedSuggestion);
            }
            else {
                //nie wybrano nic z listy, trzeba więc zdobyć ID wpisanej notatki
                getPartsByTag();
            }

        }

        if (event.keyCode != 13 && event.keyCode != 40 && event.keyCode != 38) {
            $scope.highlightedSuggestion = -1; //zmieniła się treść, wyzeruj listę z podpowiedziami
        }
    }

    $scope.editingPartKeyDown = function (event, partObjIndex) {

        //aktualizuj co jakis czas
        clearTimeout(timeoutUpdate);
        timeoutUpdate = setTimeout(function () { updatePart(partObjIndex) }, 1000);
        $scope.parts[partObjIndex].localState = "Sending";

        //2x enter dodaje nowy part
        var partObj = $scope.parts[partObjIndex];
        if (event.keyCode == 13 && /\s*<br>\s*<br>\s*$/.test(partObj.Data)) { //enter
            $scope.parts[partObjIndex].Data = $scope.parts[partObjIndex].Data.replace(/\s*<br>\s*$/g, "");
            addPart(partObjIndex);
            event.preventDefault(); //żeby nie dawało już tego entera
        }

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) {
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;

        $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
        });
    }

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function addPart(lastIndex) {

        var atIndex = lastIndex + 1;
        if (lastIndex == null) {
            atIndex = 0;
        }

        $scope.parts.splice(atIndex, 0, { Data: "&nbsp;", NoteID: $scope.currentNoteId }); //add at index

        console.log("------focusOn")
        //focusOn("part" + atIndex + "_window" + $scope.$index); //przenieś kursor do nowego parta
        document.getElementById("part" + atIndex + "_window" + $scope.$index).focus();

        $scope.parts[atIndex].localState = "Sending";

        parts.post($scope.parts[atIndex]).success(function (data) {
            $scope.parts[atIndex].ID = data.ID;
            $scope.parts[atIndex].localState = "OK";
        }).error(function () {
            $scope.parts[atIndex].localState = "Problem";
        });
    }

    function partsCheckForNull() {
        if ($scope.parts.length == 0 || $scope.parts == null) {
            addPart();
        }
    }

    function whenPartsReceived(data) {
        $scope.parts = data;
        //console.log("Got data: ");
        //console.table(data);
        partsCheckForNull();

        var a = "part" + ($scope.parts.length - 1) + "window" + ($scope.$index);
        console.log("---------"+a);
        //focusOn("part" + ($scope.parts.length - 1) + "_window" + $scope.$index); //skocz do ostatniego utworzonego parta
        var el = document.getElementById(a);
        console.log(el);
        if (el != null) {
            el.focus();
        }
    }

    $scope.suggestionClicked = function (i, evt) {
        console.log("CLICKED");
        if (evt.which === 1) {
            oneOfSuggestionsChosen(i);
        }
    }
});