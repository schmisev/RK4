(self.webpackChunkrobot_karol_4=self.webpackChunkrobot_karol_4||[]).push([[87632],{87632:(e,t,o)=>{e=o.nmd(e),ace.define("ace/mode/properties_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"],(function(e,t,o){"use strict";var r=e("../lib/oop"),i=e("./text_highlight_rules").TextHighlightRules,s=function(){var e=/\\u[0-9a-fA-F]{4}|\\/;this.$rules={start:[{token:"comment",regex:/[!#].*$/},{token:"keyword",regex:/[=:]$/},{token:"keyword",regex:/[=:]/,next:"value"},{token:"constant.language.escape",regex:e},{defaultToken:"variable"}],value:[{regex:/\\$/,token:"string",next:"value"},{regex:/$/,token:"string",next:"start"},{token:"constant.language.escape",regex:e},{defaultToken:"string"}]}};r.inherits(s,i),t.PropertiesHighlightRules=s})),ace.define("ace/mode/properties",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/properties_highlight_rules"],(function(e,t,o){"use strict";var r=e("../lib/oop"),i=e("./text").Mode,s=e("./properties_highlight_rules").PropertiesHighlightRules,a=function(){this.HighlightRules=s,this.$behaviour=this.$defaultBehaviour};r.inherits(a,i),function(){this.$id="ace/mode/properties"}.call(a.prototype),t.Mode=a})),ace.require(["ace/mode/properties"],(function(t){e&&(e.exports=t)}))}}]);