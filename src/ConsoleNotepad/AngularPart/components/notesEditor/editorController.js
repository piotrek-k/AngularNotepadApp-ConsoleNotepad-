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
    $scope.activePart = 0;

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

    $scope.addPart = function () {
        var atIndex = $scope.activePart+1;
        //console.log("atIndex: " + atIndex);

        $scope.parts.splice(atIndex, 0, { Data: "&nbsp;", NoteID: $scope.currentNoteId }); //add at index

        focusOn("part" + atIndex + "window" + $scope.$index); //przenieś kursor do nowego parta

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
            $scope.addPart();
        }
    }

    function whenPartsReceived(data) {
        $scope.parts = data;
        //console.log("Got data: ");
        //console.table(data);
        partsCheckForNull();
        focusOn("part" + ($scope.parts.length - 1) + "window" + $scope.$index); //skocz do ostatniego utworzonego parta
    }

    $scope.suggestionClicked = function (i, evt) {
        if (evt.which === 1) {
            oneOfSuggestionsChosen(i);
        }
    }

    $scope.focusedOnPart = function (i) {
        $scope.activePart = i;
    }
});