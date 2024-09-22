(self.webpackChunkrobot_karol_4=self.webpackChunkrobot_karol_4||[]).push([[64420],{64420:(e,t,n)=>{e=n.nmd(e),ace.define("ace/mode/csound_preprocessor_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"],(function(e,t,n){"use strict";var o=e("../lib/oop"),r=e("./text_highlight_rules").TextHighlightRules,s=function(e){this.embeddedRulePrefix=void 0===e?"":e,this.semicolonComments={token:"comment.line.semicolon.csound",regex:";.*$"},this.comments=[{token:"punctuation.definition.comment.begin.csound",regex:"/\\*",push:[{token:"punctuation.definition.comment.end.csound",regex:"\\*/",next:"pop"},{defaultToken:"comment.block.csound"}]},{token:"comment.line.double-slash.csound",regex:"//.*$"},this.semicolonComments],this.macroUses=[{token:["entity.name.function.preprocessor.csound","punctuation.definition.macro-parameter-value-list.begin.csound"],regex:/(\$[A-Z_a-z]\w*\.?)(\()/,next:"macro parameter value list"},{token:"entity.name.function.preprocessor.csound",regex:/\$[A-Z_a-z]\w*(?:\.|\b)/}],this.numbers=[{token:"constant.numeric.float.csound",regex:/(?:\d+[Ee][+-]?\d+)|(?:\d+\.\d*|\d*\.\d+)(?:[Ee][+-]?\d+)?/},{token:["storage.type.number.csound","constant.numeric.integer.hexadecimal.csound"],regex:/(0[Xx])([0-9A-Fa-f]+)/},{token:"constant.numeric.integer.decimal.csound",regex:/\d+/}],this.bracedStringContents=[{token:"constant.character.escape.csound",regex:/\\(?:[\\abnrt"]|[0-7]{1,3})/},{token:"constant.character.placeholder.csound",regex:/%[#0\- +]*\d*(?:\.\d+)?[diuoxXfFeEgGaAcs]/},{token:"constant.character.escape.csound",regex:/%%/}],this.quotedStringContents=[this.macroUses,this.bracedStringContents];var t=[this.comments,{token:"keyword.preprocessor.csound",regex:/#(?:e(?:nd(?:if)?|lse)\b|##)|@@?[ \t]*\d+/},{token:"keyword.preprocessor.csound",regex:/#include/,push:[this.comments,{token:"string.csound",regex:/([^ \t])(?:.*?\1)/,next:"pop"}]},{token:"keyword.preprocessor.csound",regex:/#includestr/,push:[this.comments,{token:"string.csound",regex:/([^ \t])(?:.*?\1)/,next:"pop"}]},{token:"keyword.preprocessor.csound",regex:/#[ \t]*define/,next:"define directive"},{token:"keyword.preprocessor.csound",regex:/#(?:ifn?def|undef)\b/,next:"macro directive"},this.macroUses];this.$rules={start:t,"define directive":[this.comments,{token:"entity.name.function.preprocessor.csound",regex:/[A-Z_a-z]\w*/},{token:"punctuation.definition.macro-parameter-name-list.begin.csound",regex:/\(/,next:"macro parameter name list"},{token:"punctuation.definition.macro.begin.csound",regex:/#/,next:"macro body"}],"macro parameter name list":[{token:"variable.parameter.preprocessor.csound",regex:/[A-Z_a-z]\w*/},{token:"punctuation.definition.macro-parameter-name-list.end.csound",regex:/\)/,next:"define directive"}],"macro body":[{token:"constant.character.escape.csound",regex:/\\#/},{token:"punctuation.definition.macro.end.csound",regex:/#/,next:"start"},t],"macro directive":[this.comments,{token:"entity.name.function.preprocessor.csound",regex:/[A-Z_a-z]\w*/,next:"start"}],"macro parameter value list":[{token:"punctuation.definition.macro-parameter-value-list.end.csound",regex:/\)/,next:"start"},{token:"punctuation.definition.string.begin.csound",regex:/"/,next:"macro parameter value quoted string"},this.pushRule({token:"punctuation.macro-parameter-value-parenthetical.begin.csound",regex:/\(/,next:"macro parameter value parenthetical"}),{token:"punctuation.macro-parameter-value-separator.csound",regex:"[#']"}],"macro parameter value quoted string":[{token:"constant.character.escape.csound",regex:/\\[#'()]/},{token:"invalid.illegal.csound",regex:/[#'()]/},{token:"punctuation.definition.string.end.csound",regex:/"/,next:"macro parameter value list"},this.quotedStringContents,{defaultToken:"string.quoted.csound"}],"macro parameter value parenthetical":[{token:"constant.character.escape.csound",regex:/\\\)/},this.popRule({token:"punctuation.macro-parameter-value-parenthetical.end.csound",regex:/\)/}),this.pushRule({token:"punctuation.macro-parameter-value-parenthetical.begin.csound",regex:/\(/,next:"macro parameter value parenthetical"}),t]}};o.inherits(s,r),function(){this.pushRule=function(e){if(Array.isArray(e.next))for(var t=0;t<e.next.length;t++)e.next[t]=this.embeddedRulePrefix+e.next[t];return{regex:e.regex,onMatch:function(t,n,o,r){if(0===o.length&&o.push(n),Array.isArray(e.next))for(var s=0;s<e.next.length;s++)o.push(e.next[s]);else o.push(e.next);return this.next=o[o.length-1],e.token},get next(){return Array.isArray(e.next)?e.next[e.next.length-1]:e.next},set next(t){Array.isArray(e.next)||(e.next=t)},get token(){return e.token}}},this.popRule=function(e){return e.next&&(e.next=this.embeddedRulePrefix+e.next),{regex:e.regex,onMatch:function(t,n,o,r){return o.pop(),e.next?(o.push(e.next),this.next=o[o.length-1]):this.next=o.length>1?o[o.length-1]:o.pop(),e.token}}}}.call(s.prototype),t.CsoundPreprocessorHighlightRules=s})),ace.define("ace/mode/csound_score_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/csound_preprocessor_highlight_rules"],(function(e,t,n){"use strict";var o=e("../lib/oop"),r=e("./csound_preprocessor_highlight_rules").CsoundPreprocessorHighlightRules,s=function(e){r.call(this,e),this.quotedStringContents.push({token:"invalid.illegal.csound-score",regex:/[^"]*$/});var t=this.$rules.start;t.push({token:"keyword.control.csound-score",regex:/[aBbCdefiqstvxy]/},{token:"invalid.illegal.csound-score",regex:/w/},{token:"constant.numeric.language.csound-score",regex:/z/},{token:["keyword.control.csound-score","constant.numeric.integer.decimal.csound-score"],regex:/([nNpP][pP])(\d+)/},{token:"keyword.other.csound-score",regex:/[mn]/,push:[{token:"empty",regex:/$/,next:"pop"},this.comments,{token:"entity.name.label.csound-score",regex:/[A-Z_a-z]\w*/}]},{token:"keyword.preprocessor.csound-score",regex:/r\b/,next:"repeat section"},this.numbers,{token:"keyword.operator.csound-score",regex:"[!+\\-*/^%&|<>#~.]"},this.pushRule({token:"punctuation.definition.string.begin.csound-score",regex:/"/,next:"quoted string"}),this.pushRule({token:"punctuation.braced-loop.begin.csound-score",regex:/{/,next:"loop after left brace"})),this.addRules({"repeat section":[{token:"empty",regex:/$/,next:"start"},this.comments,{token:"constant.numeric.integer.decimal.csound-score",regex:/\d+/,next:"repeat section before label"}],"repeat section before label":[{token:"empty",regex:/$/,next:"start"},this.comments,{token:"entity.name.label.csound-score",regex:/[A-Z_a-z]\w*/,next:"start"}],"quoted string":[this.popRule({token:"punctuation.definition.string.end.csound-score",regex:/"/}),this.quotedStringContents,{defaultToken:"string.quoted.csound-score"}],"loop after left brace":[this.popRule({token:"constant.numeric.integer.decimal.csound-score",regex:/\d+/,next:"loop after repeat count"}),this.comments,{token:"invalid.illegal.csound",regex:/\S.*/}],"loop after repeat count":[this.popRule({token:"entity.name.function.preprocessor.csound-score",regex:/[A-Z_a-z]\w*\b/,next:"loop after macro name"}),this.comments,{token:"invalid.illegal.csound",regex:/\S.*/}],"loop after macro name":[t,this.popRule({token:"punctuation.braced-loop.end.csound-score",regex:/}/})]}),this.normalizeRules()};o.inherits(s,r),t.CsoundScoreHighlightRules=s})),ace.define("ace/mode/csound_score",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/csound_score_highlight_rules"],(function(e,t,n){"use strict";var o=e("../lib/oop"),r=e("./text").Mode,s=e("./csound_score_highlight_rules").CsoundScoreHighlightRules,c=function(){this.HighlightRules=s};o.inherits(c,r),function(){this.lineCommentStart=";",this.blockComment={start:"/*",end:"*/"},this.$id="ace/mode/csound_score"}.call(c.prototype),t.Mode=c})),ace.require(["ace/mode/csound_score"],(function(t){e&&(e.exports=t)}))}}]);