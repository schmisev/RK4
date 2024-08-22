ace.define("ace/mode/RKScript_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module){"use strict";
var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
var RKScriptHighlightRules = function () {
    var keywords = "wiederhole|solange|mal|ende|wenn|dann|sonst|zeig|für|als|ist|anhalten|zurück|weiter|und|oder|nicht";
    var declarations = "Klasse|Funktion|Methode|Zahl|Wahrheitswert|Text|Objekt"
    var builtinConstants = ("wahr|falsch|nix|welt");
    var builtinFunctions = ("Roboter|Welt|zufallszahl|fertig|linksDrehen|rechtsDrehen|schritt|hinlegen|aufheben|markeSetzen|markeEntfernen|x|y|istAufMarke|siehtWand|siehtAbgrund|siehtZiegel|teilaufgabe");
    var keywordMapper = this.createKeywordMapper({
        "support.function": builtinFunctions,
        "keyword": keywords,
        "keyword.declaration": declarations,
        "constant.language": builtinConstants,
    }, "identifier", true);
    this.$rules = {
        "start": [{
                token: "comment",
                regex: "#.*$"
            }, {
                token: "string", // " string
                regex: '".*?"'
            }, {
                token: "constant.numeric", // float
                regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
            }, {
                token: keywordMapper,
                regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
            }, {
                token: "keyword.operator",
                regex: "\\+|\\-|\\/|\\:|%|<|>|="
            }, {
                token: "paren.lparen",
                regex: "[\\(]"
            }, {
                token: "paren.rparen",
                regex: "[\\)]"
            }, {
                token: "text",
                regex: "\\s+"
            }, {
                token: "comment", // multi line comment
                regex: "\\[",
                next: "comment"
            }],
        "comment": [
            {
                token: "comment", // closing comment
                regex: "\\]",
                next: "start"
            }, {
                defaultToken: "comment"
            }
        ]
    };
};
oop.inherits(RKScriptHighlightRules, TextHighlightRules);
exports.RKScriptHighlightRules = RKScriptHighlightRules;
});
    
ace.define("ace/mode/RKScript",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/RKScript_highlight_rules"], function(require, exports, module){"use strict";
var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var RKScriptHighlightRules = require("./RKScript_highlight_rules").RKScriptHighlightRules;
var Mode = function () {
    this.HighlightRules = RKScriptHighlightRules;
    this.$behaviour = this.$defaultBehaviour;
};
oop.inherits(Mode, TextMode);
(function () {
    this.lineCommentStart = "#";
    this.$id = "ace/mode/RKScript";
}).call(Mode.prototype);
exports.Mode = Mode;

});
    
(function() {
    ace.require(["ace/mode/RKScript"], function(m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();
