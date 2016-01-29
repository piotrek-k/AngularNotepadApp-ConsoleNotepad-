(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        eval(data[0].Data);
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        eval(data[0].Data);
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '=',
            evalFromParent: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        eval(data[0].Data);
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '=',
            evalFromParent: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        if (scope.evalFromParent) {

                        } else {
                            eval(data[0].Data);
                        }
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '=',
            evalFromParent: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        if (scope.evalFromParent) {

                        } else {
                            eval(data[0].Data);
                        }
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            scope.evalFromParent = function (data) {
                //evaluate some scripts from this position
                eval(data);
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '=',
            evalFromParent: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        if (scope.evalFromParent) {
                            $parent.evalFromParent(data[0].Data);
                        } else {
                            eval(data[0].Data);
                        }
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            scope.evalFromParent = function (data) {
                //evaluate some scripts from this position
                eval(data);
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '=',
            evalFromParent: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        if (scope.evalFromParent) {
                            $parent.evalFromParent(data[0].Data);
                        } else {
                            eval(data[0].Data);
                        }
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            scope.evalFromParent = function (data) {
                //evaluate some scripts from this position
                console.log("Evaluated from parent");
                eval(data);
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '=',
            evalFromParent: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        if (scope.evalFromParent) {
                            scope.$parent.evalFromParent(data[0].Data);
                        } else {
                            eval(data[0].Data);
                        }
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            scope.evalFromParent = function (data) {
                //evaluate some scripts from this position
                console.log("Evaluated from parent");
                eval(data);
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '=',
            evalFromParent: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        if (scope.evalFromParent) {
                            scope.$parent.evalFromParent(data[0].Data);
                            console.log("From parent");
                        } else {
                            eval(data[0].Data);
                        }
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            scope.evalFromParent = function (data) {
                //evaluate some scripts from this position
                console.log("Evaluated from parent");
                eval(data);
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '=',
            evalFromParent: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        console.log("From parent" + scope.evalFromParent);
                        if (scope.evalFromParent) {
                            scope.$parent.evalFromParent(data[0].Data);
                            
                        } else {
                            eval(data[0].Data);
                        }
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            scope.evalFromParent = function (data) {
                //evaluate some scripts from this position
                console.log("Evaluated from parent");
                eval(data);
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '=',
            evalFromParent: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        console.log("From parent" + scope.evalFromParent);
                        scope.$parent.evalFromParent(data[0].Data);
                        if (scope.evalFromParent) {
                           
                            
                        } else {
                            eval(data[0].Data);
                        }
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            scope.evalFromParent = function (data) {
                //evaluate some scripts from this position
                console.log("Evaluated from parent");
                eval(data);
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '=',
            evalFromParent: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        console.log("From parent" + scope.evalFromParent);
                        scope.$parent.evalFromParent(data[0].Data);
                        //if (scope.evalFromParent) {
                           
                            
                        //} else {
                        //    eval(data[0].Data);
                        //}
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            scope.evalFromParent = function (data) {
                //evaluate some scripts from this position
                console.log("Evaluated from parent");
                eval(data);
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});
(function () {
    'use strict';

    
})();

var app = angular.module('ConsoleNotepad', [
        // Angular modules 
        'ngRoute'

        // Custom modules 

        // 3rd Party Modules

]);

app.directive('ace', ['$timeout', function ($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength

        if (rows < 10) {
            rows = 10;
        }

        $(elem).height(rows * lineHeight);
        editor.resize();
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            //language: '=ace'
        },
        link: function (scope, elem, attrs, ngModel) {
            var node = elem[0];
            //console.log(attrs.ace);

            var editor = ace.edit(node);

            editor.setTheme('ace/theme/monokai');

            //var MarkdownMode = require('ace/mode/markdown').Mode;
            console.log("language: " + attrs.ace);
            editor.getSession().setMode("ace/mode/" + attrs.ace);

            // set editor options
            editor.setShowPrintMargin(false);

            //aktualizacja tekstu w edytorze
            scope.$watch('ngModel', function () {
                //console.log("editor before: " + editor.getValue());
                if (editor.getValue() != scope.ngModel) {
                    editor.setValue(scope.ngModel, 1); 
                }
                //console.log("editor after: " + scope.ngModel);
            });

            editor.on('change', function () {
                $timeout(function () {
                    scope.$apply(function () {
                        var value = editor.getValue();
                        scope.ngModel = value;
                    });
                });

                resizeEditor(editor, elem);
            });
        }
    };
}]);
app.directive('appendScript', function (notes, parts) {
    return {
        restrict: 'AE',
        scope: {
            noteName: '=',
            //evalFromParent: '='
        },
        link: function (scope, elem, attrs) {
            console.log("loading script " + scope.noteName);
            notes.getByTag(scope.noteName).success(function (noteData) {
                console.table(noteData);
                scope.currentNoteId = noteData.NoteId;
                //checkForSpecialTags($scope.smartBar);

                scope.parts = parts.get(scope.currentNoteId).success(function (data) {
                    //whenPartsReceived(data);
                    console.log("Part with script received");
                    console.table(data);
                    console.table(data[0]);

                    if (data.length == 1) {
                        console.log("From parent" + scope.evalFromParent);
                        scope.$parent.evalFromParent(data[0].Data);
                        //if (scope.evalFromParent) {
                           
                            
                        //} else {
                        //    eval(data[0].Data);
                        //}
                    }
                    else {
                        console.error("Nieprawidlowa ilosc partow: " + data.length);
                    }
                });
            });
        }
    };
});
//app.directive('contenteditable', function () {
//    return {
//        restrict: 'A', // only activate on element attribute
//        require: '?ngModel', // get a hold of NgModelController
//        link: function (scope, element, attrs, ngModel) {
//            if (!ngModel) return; // do nothing if no ng-model

//            // Specify how UI should be updated
//            ngModel.$render = function () {
//                element.html(ngModel.$viewValue || '');
//            };

//            // Listen for change events to enable binding
//            element.on('blur keyup change', function () {
//                scope.$apply(read);
//            });
//            read(); // initialize

//            // Write data to the model
//            function read() {
//                var html = element.html();
//                // When we clear the content editable the browser leaves a <br> behind
//                // If strip-br attribute is provided then we strip this out
//                if (attrs.stripBr && html == '<br>') {
//                    html = '';
//                }
//                ngModel.$setViewValue(html);
//            }
//        }
//    };
//});

app.directive('contenteditable', [function () {
    return {
        require: '?ngModel',
        scope: {

        },
        link: function (scope, element, attrs, ctrl) {
            // view -> model (when div gets blur update the view value of the model)
            element.bind('blur keyup change', function () {
                scope.$apply(function () {
                    ctrl.$setViewValue(element.html());
                });
            });

            // model -> view
            ctrl.$render = function () {
                element.html(ctrl.$viewValue);
            };

            // load init value from DOM
            ctrl.$render();

            // remove the attached events to element when destroying the scope
            scope.$on('$destroy', function () {
                element.unbind('blur');
                element.unbind('paste');
                element.unbind('focus');
            });
        }
    };
}]);
app.directive('focusOn', function ($timeout) {
    return function (scope, elem, attr) {
        scope.$on('focusOn', function (e, name) {
            if (name === attr.focusOn) {
                $timeout(function () {
                    
                    elem[0].focus();

                    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                        var range = document.createRange();
                        range.selectNodeContents(elem[0]);
                        range.collapse(false);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (typeof document.body.createTextRange != "undefined") {
                        var textRange = document.body.createTextRange();
                        textRange.moveToElementText(elem[0]);
                        textRange.collapse(false);
                        textRange.select();
                    }
                });
            }
        });
    };
});

app.factory('focusOn', function ($rootScope, $timeout) {
    return function (name) {
        $timeout(function () {
            //console.log("focusOn" + name);
            $rootScope.$broadcast('focusOn', name);
        });
    }
});
app.directive('viewLoader', function (notes, parts, $compile) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            ngModel: '=?',
            settings: '=partSettings'
        },
        link: function (scope, elem, attrs, ngModel) {
            //console.log("this");
            //console.dir(this);
            //console.table(attrs.partSettings);
            //console.log("scopesettingd");
            //console.table(scope.settings);
            if (scope.settings != undefined) {
                scope.oldSettings = scope.settings;

                scope.viewAdress = scope.settings["view"] != undefined ? scope.settings["view"] : "";
                scope.scriptAdress = scope.settings["script"] != undefined ? scope.settings["script"] : "";

                reloadView(scope.viewAdress);
                loadScript(scope.scriptAdress);
            }

            function reloadView(adress) {
                //console.log("adres: " + adress);
                if (adress != undefined && adress != "") {
                    //console.log("loading note");
                    notes.getByTag(adress).success(function (noteData) {
                        //console.log("noteloaded");
                        //console.table(noteData);
                        var currentNoteId = noteData.NoteId;
                        parts.get(currentNoteId).success(function (data) {
                            //console.log("part loaded");
                            //console.table(data);
                            if (data.length == 1) {
                                var html = data[0].Data;
                                elem.html(html);
                                $compile(elem.contents())(scope);
                            }
                            else {
                                console.error("Nieprawidlowa ilosc partow: " + data.length);
                            }
                        });
                    });
                }
            }

            function loadScript(adress) {
                notes.getByTag(adress).success(function (noteData) {
                    var currentNoteId = noteData.NoteId;
                    parts.get(currentNoteId).success(function (data) {
                        if (data.length == 1) {
                            eval(data[0].Data);
                        }
                        else {
                            console.error("Nieprawidlowa ilosc partow: " + data.length);
                        }
                    });
                });
            }

            scope.evalFromParent = function (data) {
                //evaluate some scripts from this position
                console.log("Evaluated from parent");
                eval(data);
            }

            //attrs.$observe('partSettings', function (newval) {
            //    console.log("newval");
            //    //console.table(newval);

            //    if (scope.oldSettings["view"] != newval["view"]) {
            //        reloadView(newval["view"]);
            //    }
            //    else {
            //        console.log("brak zmian");
            //    }
            //});
        }
    };
});
app.controller('editorController', function ($scope, notes, parts, focusOn, $element) {
    $scope.windowId = 0;

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
    //$scope.focusOnPart = 0;
    $scope.activePart = 0;
    //$scope.theOnlyPartData = "jakies costam"; //dla kodu

    $scope.onePartNote = false; //notatki z kodem mogą mieć tylko jeden part, chowa przycisk
    $scope.noteType = ""; //typ notatki, dostosowuje edytor

    getPartsByTag(); //ładuje notatkę która nie ma tagów (strona startowa)
    focusOn("smartBar");

    $scope.setWindowID = function (index) {
        console.log("windowID: " + index)
        $scope.windowId = index;
    }

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
            angular.element("#smartBar").blur();
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

    function updatePart(index) {

        $scope.parts[index].localState = "Sending";

        parts.put($scope.parts[index]).success(function () {
            $scope.parts[index].localState = "OK";
        }).error(function () {
            $scope.parts[index].localState = "Problem";
        });

    }

    function getPartsByTag() {
        if ($scope.smartBar == undefined) {
            $scope.smartBar = "";
        }
        notes.getByTag($scope.smartBar).success(function (noteData) {
            //console.table(noteData);
            $scope.currentNoteId = noteData.NoteId;
            checkForSpecialTags($scope.smartBar);

            $scope.parts = parts.get($scope.currentNoteId).success(function (data) {
                whenPartsReceived(data);
            });
        });
    }

    function oneOfSuggestionsChosen(i) { //wybrano opcję z listy
        $scope.smartBar = "";

        var note = $scope.suggestions[i];
        console.table(note);

        //uzupelniam smartBar o wybrane tagi
        for (var nt in note.NoteTags) {
            $scope.smartBar += note.NoteTags[nt].Tag.Name + " ";
        }

        $scope.currentNoteId = note.NoteId;
        checkForSpecialTags($scope.smartBar);

        parts.get($scope.currentNoteId).success(function (data) {
            whenPartsReceived(data);
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
            //data[p].Settings = new Array();
            //data[p].Settings.push(["view", "!view some tag"]);
            //data[p].Settings.push(["test", "!view some tag"]);
            //data[p].Settings[0] = "z cyferkom";
            //console.table(data[p].Settings);
        }

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

    $scope.focusedOnPart = function (i) { //gdy on-focus na jednym z part'ów
        $scope.activePart = i;
    }

    function checkForSpecialTags(tagsAsString) {
        //może istnieć tylko jeden tag specjalny na notatke
        var a = tagsAsString.split(" ");
        var specialTagType = "";

        for (var x in a) {
            if (a[x].charAt(0) == "!") { //to jest tag specjalny
                specialTagType = a[x].substring(1); //utnij pierwszy znak
                break;
            }
        }

        if (specialTagType == "code" || specialTagType == "c") {
            $scope.noteType = "javascript";
            $scope.onePartNote = true;
        }
        else if (specialTagType == "view" || specialTagType == "v") {
            $scope.noteType = "html";
            $scope.onePartNote = true;
        }
        else {
            $scope.noteType = "text";
            $scope.onePartNote = false;
        }
    }
});
app.factory('notes', ['$http', function ($http) {
    
    var notes = {};

    notes.get = function () {
        //TODO
        //return $http.get('/api/notes')
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    notes.getSuggested = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/suggested?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.getByTag = function (searchText) {
        return $http({
            method: 'GET',
            url: '/api/notes/bytags?searchText=' + searchText,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    notes.post = function (data) {
        //TODO
        //return $http({
        //    method: 'POST',
        //    url: '/api/Parts',
        //    data: data,
        //    headers: {
        //        'Accept': 'application/json'
        //    }
        //});
    }

    notes.put = function (note) {
        console.table(note);
        //TODO
        //return $http.get('/api/notes/', note)
        //          .success(function (data) {
        //              return data;
        //          })
        //          .error(function (err) {
        //              return err;
        //          });
    }

    return notes;
}]);
app.factory('parts', ['$http', function ($http) {

    var parts = {};

    parts.get = function (idOfNote) {
        return $http({
            method: 'GET',
            url: '/api/parts?idOfNote=' + idOfNote,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.post = function (nextPart) {
        //console.log("nextPart:");
        //console.table(nextPart);
        return $http({
            method: 'POST',
            url: '/api/Parts',
            data: nextPart,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    parts.put = function (part) {
        //console.log("Updating...");
        //console.table(part);
        if (part.Settings == undefined && part.SettingsAsJSON != undefined) {
            console.warn("Ustawienia part'a zostały wyzerowane");
        }
        part.SettingsAsJSON = JSON.stringify(part.Settings);
        //console.log(part.SettingsAsJSON);

        return $http({
            method: 'PUT',
            url: '/api/Parts/' + part.ID,
            data: part,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    return parts;
}]);
app.controller('windowsController', function ($scope, notes, parts, focusOn) {

    $scope.numberOfWindows = [0]; //zawartosc tablicy nie ma znaczenia
    $scope.preventDuplicates = 1; //nie moze byc duplikatow, nadawaj ID okienkom

    $scope.addWindow = function (index) {
        if (index == undefined) {
            $scope.numberOfWindows.push(0);
        }
        $scope.numberOfWindows.splice(index+1, 0, $scope.preventDuplicates);
        $scope.preventDuplicates++;
        console.table($scope.numberOfWindows);
    }

    $scope.removeWindow = function (index) {
        $scope.numberOfWindows.splice(index, 1);
    }
});