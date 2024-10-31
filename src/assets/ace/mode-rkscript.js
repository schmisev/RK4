import { ENV } from "../../spec";
import { KEYWORDS } from "../../language/frontend/lexer";

ace.define("ace/mode/RKScript_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module){"use strict";
var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
var RKScriptHighlightRules = function () {
    var keywordMapper = this.createKeywordMapper({
        "support.function": Object.values(ENV.global.fn).join("|"),
        "support.class": ENV.robot.cls + "|" + ENV.world.cls,
        "entity.name.function": "",
        "keyword": Object.keys(KEYWORDS).join("|"),
        "constant.language": Object.values(ENV.global.const).join("|"),
    }, "text", true);
    this.$rules = {
        "start": [{
                token: "comment",
                regex: "\\/\\/.*$",
                unicode: true,
            }, {
                token: "comment.doc",
                regex: "#.*$",
                unicode: true,
            }, {
                token: "string", // " string
                regex: '"',
                next: "string",
            }, {
                token: "entity.other.attribute-name",
                regex: '(?<=\\.)([\\p{L}0-9]+)'
            }, {
                token: "constant.numeric", // int
                regex: "[+-]?\\d+\\b"
            }, {
                token: keywordMapper,
                regex: "[\\p{L}0-9]+\\b",
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
                regex: "\\/\\*",
                next: "comment"
            }, {
                token: "keyword.operator",
                regex: "\\+|-|\\/|:|%|<|>|=|\\*"
            }],
        "comment": [
            {
                token: "comment", // closing comment
                regex: "\\*\\/",
                next: "start"
            }, {
                defaultToken: "comment"
            }
        ],
        "string": [
            {
                token: "string", // closing string
                regex: '"',
                next: "start"
            }, {
                defaultToken: "string"
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
