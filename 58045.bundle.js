(self.webpackChunkrobot_karol_4=self.webpackChunkrobot_karol_4||[]).push([[58045],{58045:(e,t,n)=>{e=n.nmd(e),ace.define("ace/mode/pascal_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"],(function(e,t,n){"use strict";var o=e("../lib/oop"),i=e("./text_highlight_rules").TextHighlightRules,r=function(){var e=this.createKeywordMapper({"keyword.control":"absolute|abstract|all|and|and_then|array|as|asm|attribute|begin|bindable|case|class|const|constructor|destructor|div|do|do|else|end|except|export|exports|external|far|file|finalization|finally|for|forward|goto|if|implementation|import|in|inherited|initialization|interface|interrupt|is|label|library|mod|module|name|near|nil|not|object|of|only|operator|or|or_else|otherwise|packed|pow|private|program|property|protected|public|published|qualified|record|repeat|resident|restricted|segment|set|shl|shr|then|to|try|type|unit|until|uses|value|var|view|virtual|while|with|xor"},"identifier",!0);this.$rules={start:[{caseInsensitive:!0,token:["variable","text","storage.type.prototype","entity.name.function.prototype"],regex:"\\b(function|procedure)(\\s+)(\\w+)(\\.\\w+)?(?=(?:\\(.*?\\))?;\\s*(?:attribute|forward|external))"},{caseInsensitive:!0,token:["variable","text","storage.type.function","entity.name.function"],regex:"\\b(function|procedure)(\\s+)(\\w+)(\\.\\w+)?"},{caseInsensitive:!0,token:e,regex:/\b[a-z_]+\b/},{token:"constant.numeric",regex:"\\b((0(x|X)[0-9a-fA-F]*)|(([0-9]+\\.?[0-9]*)|(\\.[0-9]+))((e|E)(\\+|-)?[0-9]+)?)(L|l|UL|ul|u|U|F|f|ll|LL|ull|ULL)?\\b"},{token:"punctuation.definition.comment",regex:"--.*$"},{token:"punctuation.definition.comment",regex:"//.*$"},{token:"punctuation.definition.comment",regex:"\\(\\*",push:[{token:"punctuation.definition.comment",regex:"\\*\\)",next:"pop"},{defaultToken:"comment.block.one"}]},{token:"punctuation.definition.comment",regex:"\\{",push:[{token:"punctuation.definition.comment",regex:"\\}",next:"pop"},{defaultToken:"comment.block.two"}]},{token:"punctuation.definition.string.begin",regex:'"',push:[{token:"constant.character.escape",regex:"\\\\."},{token:"punctuation.definition.string.end",regex:'"',next:"pop"},{defaultToken:"string.quoted.double"}]},{token:"punctuation.definition.string.begin",regex:"'",push:[{token:"constant.character.escape.apostrophe",regex:"''"},{token:"punctuation.definition.string.end",regex:"'",next:"pop"},{defaultToken:"string.quoted.single"}]},{token:"keyword.operator",regex:"[+\\-;,/*%]|:=|="}]},this.normalizeRules()};o.inherits(r,i),t.PascalHighlightRules=r})),ace.define("ace/mode/folding/coffee",["require","exports","module","ace/lib/oop","ace/mode/folding/fold_mode","ace/range"],(function(e,t,n){"use strict";var o=e("../../lib/oop"),i=e("./fold_mode").FoldMode,r=e("../../range").Range,a=t.FoldMode=function(){};o.inherits(a,i),function(){this.commentBlock=function(e,t){var n=/\S/,o=e.getLine(t),i=o.search(n);if(-1!=i&&"#"==o[i]){for(var a=o.length,s=e.getLength(),l=t,c=t;++t<s;){var u=(o=e.getLine(t)).search(n);if(-1!=u){if("#"!=o[u])break;c=t}}if(c>l){var d=e.getLine(c).length;return new r(l,a,c,d)}}},this.getFoldWidgetRange=function(e,t,n){var o=this.indentationBlock(e,n);return o||(o=this.commentBlock(e,n))||void 0},this.getFoldWidget=function(e,t,n){var o=e.getLine(n),i=o.search(/\S/),r=e.getLine(n+1),a=e.getLine(n-1),s=a.search(/\S/),l=r.search(/\S/);if(-1==i)return e.foldWidgets[n-1]=-1!=s&&s<l?"start":"","";if(-1==s){if(i==l&&"#"==o[i]&&"#"==r[i])return e.foldWidgets[n-1]="",e.foldWidgets[n+1]="","start"}else if(s==i&&"#"==o[i]&&"#"==a[i]&&-1==e.getLine(n-2).search(/\S/))return e.foldWidgets[n-1]="start",e.foldWidgets[n+1]="","";return e.foldWidgets[n-1]=-1!=s&&s<i?"start":"",i<l?"start":""}}.call(a.prototype)})),ace.define("ace/mode/pascal",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/pascal_highlight_rules","ace/mode/folding/coffee"],(function(e,t,n){"use strict";var o=e("../lib/oop"),i=e("./text").Mode,r=e("./pascal_highlight_rules").PascalHighlightRules,a=e("./folding/coffee").FoldMode,s=function(){this.HighlightRules=r,this.foldingRules=new a,this.$behaviour=this.$defaultBehaviour};o.inherits(s,i),function(){this.lineCommentStart=["--","//"],this.blockComment=[{start:"(*",end:"*)"},{start:"{",end:"}"}],this.$id="ace/mode/pascal"}.call(s.prototype),t.Mode=s})),ace.require(["ace/mode/pascal"],(function(t){e&&(e.exports=t)}))}}]);