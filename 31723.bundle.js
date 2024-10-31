(self.webpackChunkrk4=self.webpackChunkrk4||[]).push([[31723],{31723:(e,t,r)=>{e=r.nmd(e),ace.define("ace/mode/turtle_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"],(function(e,t,r){"use strict";var i=e("../lib/oop"),n=e("./text_highlight_rules").TextHighlightRules,o=function(){this.$rules={start:[{include:"#comments"},{include:"#strings"},{include:"#base-prefix-declarations"},{include:"#string-language-suffixes"},{include:"#string-datatype-suffixes"},{include:"#relative-urls"},{include:"#xml-schema-types"},{include:"#rdf-schema-types"},{include:"#owl-types"},{include:"#qnames"},{include:"#punctuation-operators"}],"#base-prefix-declarations":[{token:"keyword.other.prefix.turtle",regex:/@(?:base|prefix)/}],"#comments":[{token:["punctuation.definition.comment.turtle","comment.line.hash.turtle"],regex:/(#)(.*$)/}],"#owl-types":[{token:"support.type.datatype.owl.turtle",regex:/owl:[a-zA-Z]+/}],"#punctuation-operators":[{token:"keyword.operator.punctuation.turtle",regex:/;|,|\.|\(|\)|\[|\]/}],"#qnames":[{token:"entity.name.other.qname.turtle",regex:/(?:[a-zA-Z][-_a-zA-Z0-9]*)?:(?:[_a-zA-Z][-_a-zA-Z0-9]*)?/}],"#rdf-schema-types":[{token:"support.type.datatype.rdf.schema.turtle",regex:/rdfs?:[a-zA-Z]+|(?:^|\s)a(?:\s|$)/}],"#relative-urls":[{token:"string.quoted.other.relative.url.turtle",regex:/</,push:[{token:"string.quoted.other.relative.url.turtle",regex:/>/,next:"pop"},{defaultToken:"string.quoted.other.relative.url.turtle"}]}],"#string-datatype-suffixes":[{token:"keyword.operator.datatype.suffix.turtle",regex:/\^\^/}],"#string-language-suffixes":[{token:["keyword.operator.language.suffix.turtle","constant.language.suffix.turtle"],regex:/(?!")(@)([a-z]+(?:\-[a-z0-9]+)*)/}],"#strings":[{token:"string.quoted.triple.turtle",regex:/"""/,push:[{token:"string.quoted.triple.turtle",regex:/"""/,next:"pop"},{defaultToken:"string.quoted.triple.turtle"}]},{token:"string.quoted.double.turtle",regex:/"/,push:[{token:"string.quoted.double.turtle",regex:/"/,next:"pop"},{token:"invalid.string.newline",regex:/$/},{token:"constant.character.escape.turtle",regex:/\\./},{defaultToken:"string.quoted.double.turtle"}]}],"#xml-schema-types":[{token:"support.type.datatype.xml.schema.turtle",regex:/xsd?:[a-z][a-zA-Z]+/}]},this.normalizeRules()};o.metaData={fileTypes:["ttl","nt"],name:"Turtle",scopeName:"source.turtle"},i.inherits(o,n),t.TurtleHighlightRules=o})),ace.define("ace/mode/folding/cstyle",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"],(function(e,t,r){"use strict";var i=e("../../lib/oop"),n=e("../../range").Range,o=e("./fold_mode").FoldMode,l=t.FoldMode=function(e){e&&(this.foldingStartMarker=new RegExp(this.foldingStartMarker.source.replace(/\|[^|]*?$/,"|"+e.start)),this.foldingStopMarker=new RegExp(this.foldingStopMarker.source.replace(/\|[^|]*?$/,"|"+e.end)))};i.inherits(l,o),function(){this.foldingStartMarker=/([\{\[\(])[^\}\]\)]*$|^\s*(\/\*)/,this.foldingStopMarker=/^[^\[\{\(]*([\}\]\)])|^[\s\*]*(\*\/)/,this.singleLineBlockCommentRe=/^\s*(\/\*).*\*\/\s*$/,this.tripleStarBlockCommentRe=/^\s*(\/\*\*\*).*\*\/\s*$/,this.startRegionRe=/^\s*(\/\*|\/\/)#?region\b/,this._getFoldWidgetBase=this.getFoldWidget,this.getFoldWidget=function(e,t,r){var i=e.getLine(r);if(this.singleLineBlockCommentRe.test(i)&&!this.startRegionRe.test(i)&&!this.tripleStarBlockCommentRe.test(i))return"";var n=this._getFoldWidgetBase(e,t,r);return!n&&this.startRegionRe.test(i)?"start":n},this.getFoldWidgetRange=function(e,t,r,i){var n,o=e.getLine(r);if(this.startRegionRe.test(o))return this.getCommentRegionBlock(e,o,r);if(n=o.match(this.foldingStartMarker)){var l=n.index;if(n[1])return this.openingBracketBlock(e,n[1],r,l);var s=e.getCommentFoldRange(r,l+n[0].length,1);return s&&!s.isMultiLine()&&(i?s=this.getSectionRange(e,r):"all"!=t&&(s=null)),s}return"markbegin"!==t&&(n=o.match(this.foldingStopMarker))?(l=n.index+n[0].length,n[1]?this.closingBracketBlock(e,n[1],r,l):e.getCommentFoldRange(r,l,-1)):void 0},this.getSectionRange=function(e,t){for(var r=e.getLine(t),i=r.search(/\S/),o=t,l=r.length,s=t+=1,a=e.getLength();++t<a;){var u=(r=e.getLine(t)).search(/\S/);if(-1!==u){if(i>u)break;var g=this.getFoldWidgetRange(e,"all",t);if(g){if(g.start.row<=o)break;if(g.isMultiLine())t=g.end.row;else if(i==u)break}s=t}}return new n(o,l,s,e.getLine(s).length)},this.getCommentRegionBlock=function(e,t,r){for(var i=t.search(/\s*$/),o=e.getLength(),l=r,s=/^\s*(?:\/\*|\/\/|--)#?(end)?region\b/,a=1;++r<o;){t=e.getLine(r);var u=s.exec(t);if(u&&(u[1]?a--:a++,!a))break}if(r>l)return new n(l,i,r,t.length)}}.call(l.prototype)})),ace.define("ace/mode/turtle",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/turtle_highlight_rules","ace/mode/folding/cstyle"],(function(e,t,r){"use strict";var i=e("../lib/oop"),n=e("./text").Mode,o=e("./turtle_highlight_rules").TurtleHighlightRules,l=e("./folding/cstyle").FoldMode,s=function(){this.HighlightRules=o,this.foldingRules=new l};i.inherits(s,n),function(){this.$id="ace/mode/turtle"}.call(s.prototype),t.Mode=s})),ace.require(["ace/mode/turtle"],(function(t){e&&(e.exports=t)}))}}]);