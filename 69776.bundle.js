(self.webpackChunkrobot_karol_4=self.webpackChunkrobot_karol_4||[]).push([[69776],{69776:(e,t,n)=>{e=n.nmd(e),ace.define("ace/mode/xml_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"],(function(e,t,n){"use strict";var r=e("../lib/oop"),a=e("./text_highlight_rules").TextHighlightRules,o=function(e){var t="[_:a-zA-ZÀ-￿][-_:.a-zA-Z0-9À-￿]*";this.$rules={start:[{token:"string.cdata.xml",regex:"<\\!\\[CDATA\\[",next:"cdata"},{token:["punctuation.instruction.xml","keyword.instruction.xml"],regex:"(<\\?)("+t+")",next:"processing_instruction"},{token:"comment.start.xml",regex:"<\\!--",next:"comment"},{token:["xml-pe.doctype.xml","xml-pe.doctype.xml"],regex:"(<\\!)(DOCTYPE)(?=[\\s])",next:"doctype",caseInsensitive:!0},{include:"tag"},{token:"text.end-tag-open.xml",regex:"</"},{token:"text.tag-open.xml",regex:"<"},{include:"reference"},{defaultToken:"text.xml"}],processing_instruction:[{token:"entity.other.attribute-name.decl-attribute-name.xml",regex:t},{token:"keyword.operator.decl-attribute-equals.xml",regex:"="},{include:"whitespace"},{include:"string"},{token:"punctuation.xml-decl.xml",regex:"\\?>",next:"start"}],doctype:[{include:"whitespace"},{include:"string"},{token:"xml-pe.doctype.xml",regex:">",next:"start"},{token:"xml-pe.xml",regex:"[-_a-zA-Z0-9:]+"},{token:"punctuation.int-subset",regex:"\\[",push:"int_subset"}],int_subset:[{token:"text.xml",regex:"\\s+"},{token:"punctuation.int-subset.xml",regex:"]",next:"pop"},{token:["punctuation.markup-decl.xml","keyword.markup-decl.xml"],regex:"(<\\!)("+t+")",push:[{token:"text",regex:"\\s+"},{token:"punctuation.markup-decl.xml",regex:">",next:"pop"},{include:"string"}]}],cdata:[{token:"string.cdata.xml",regex:"\\]\\]>",next:"start"},{token:"text.xml",regex:"\\s+"},{token:"text.xml",regex:"(?:[^\\]]|\\](?!\\]>))+"}],comment:[{token:"comment.end.xml",regex:"--\x3e",next:"start"},{defaultToken:"comment.xml"}],reference:[{token:"constant.language.escape.reference.xml",regex:"(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)"}],attr_reference:[{token:"constant.language.escape.reference.attribute-value.xml",regex:"(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)"}],tag:[{token:["meta.tag.punctuation.tag-open.xml","meta.tag.punctuation.end-tag-open.xml","meta.tag.tag-name.xml"],regex:"(?:(<)|(</))((?:"+t+":)?"+t+")",next:[{include:"attributes"},{token:"meta.tag.punctuation.tag-close.xml",regex:"/?>",next:"start"}]}],tag_whitespace:[{token:"text.tag-whitespace.xml",regex:"\\s+"}],whitespace:[{token:"text.whitespace.xml",regex:"\\s+"}],string:[{token:"string.xml",regex:"'",push:[{token:"string.xml",regex:"'",next:"pop"},{defaultToken:"string.xml"}]},{token:"string.xml",regex:'"',push:[{token:"string.xml",regex:'"',next:"pop"},{defaultToken:"string.xml"}]}],attributes:[{token:"entity.other.attribute-name.xml",regex:t},{token:"keyword.operator.attribute-equals.xml",regex:"="},{include:"tag_whitespace"},{include:"attribute_value"}],attribute_value:[{token:"string.attribute-value.xml",regex:"'",push:[{token:"string.attribute-value.xml",regex:"'",next:"pop"},{include:"attr_reference"},{defaultToken:"string.attribute-value.xml"}]},{token:"string.attribute-value.xml",regex:'"',push:[{token:"string.attribute-value.xml",regex:'"',next:"pop"},{include:"attr_reference"},{defaultToken:"string.attribute-value.xml"}]}]},this.constructor===o&&this.normalizeRules()};(function(){this.embedTagRules=function(e,t,n){this.$rules.tag.unshift({token:["meta.tag.punctuation.tag-open.xml","meta.tag."+n+".tag-name.xml"],regex:"(<)("+n+"(?=\\s|>|$))",next:[{include:"attributes"},{token:"meta.tag.punctuation.tag-close.xml",regex:"/?>",next:t+"start"}]}),this.$rules[n+"-end"]=[{include:"attributes"},{token:"meta.tag.punctuation.tag-close.xml",regex:"/?>",next:"start",onMatch:function(e,t,n){return n.splice(0),this.token}}],this.embedRules(e,t,[{token:["meta.tag.punctuation.end-tag-open.xml","meta.tag."+n+".tag-name.xml"],regex:"(</)("+n+"(?=\\s|>|$))",next:n+"-end"},{token:"string.cdata.xml",regex:"<\\!\\[CDATA\\["},{token:"string.cdata.xml",regex:"\\]\\]>"}])}}).call(a.prototype),r.inherits(o,a),t.XmlHighlightRules=o})),ace.define("ace/mode/behaviour/xml",["require","exports","module","ace/lib/oop","ace/mode/behaviour","ace/token_iterator"],(function(e,t,n){"use strict";var r=e("../../lib/oop"),a=e("../behaviour").Behaviour,o=e("../../token_iterator").TokenIterator;function i(e,t){return e&&e.type.lastIndexOf(t+".xml")>-1}var l=function(){this.add("string_dquotes","insertion",(function(e,t,n,r,a){if('"'==a||"'"==a){var l=a,u=r.doc.getTextRange(n.getSelectionRange());if(""!==u&&"'"!==u&&'"'!=u&&n.getWrapBehavioursEnabled())return{text:l+u+l,selection:!1};var s=n.getCursorPosition(),g=r.doc.getLine(s.row).substring(s.column,s.column+1),c=new o(r,s.row,s.column),m=c.getCurrentToken();if(g==l&&(i(m,"attribute-value")||i(m,"string")))return{text:"",selection:[1,1]};if(m||(m=c.stepBackward()),!m)return;for(;i(m,"tag-whitespace")||i(m,"whitespace");)m=c.stepBackward();var x=!g||g.match(/\s/);if(i(m,"attribute-equals")&&(x||">"==g)||i(m,"decl-attribute-equals")&&(x||"?"==g))return{text:l+l,selection:[1,1]}}})),this.add("string_dquotes","deletion",(function(e,t,n,r,a){var o=r.doc.getTextRange(a);if(!a.isMultiLine()&&('"'==o||"'"==o)&&r.doc.getLine(a.start.row).substring(a.start.column+1,a.start.column+2)==o)return a.end.column++,a})),this.add("autoclosing","insertion",(function(e,t,n,r,a){if(">"==a){var l=n.getSelectionRange().start,u=new o(r,l.row,l.column),s=u.getCurrentToken()||u.stepBackward();if(!s||!(i(s,"tag-name")||i(s,"tag-whitespace")||i(s,"attribute-name")||i(s,"attribute-equals")||i(s,"attribute-value")))return;if(i(s,"reference.attribute-value"))return;if(i(s,"attribute-value")){var g=u.getCurrentTokenColumn()+s.value.length;if(l.column<g)return;if(l.column==g){var c=u.stepForward();if(c&&i(c,"attribute-value"))return;u.stepBackward()}}if(/^\s*>/.test(r.getLine(l.row).slice(l.column)))return;for(;!i(s,"tag-name");)if("<"==(s=u.stepBackward()).value){s=u.stepForward();break}var m=u.getCurrentTokenRow(),x=u.getCurrentTokenColumn();if(i(u.stepBackward(),"end-tag-open"))return;var d=s.value;if(m==l.row&&(d=d.substring(0,l.column-x)),this.voidElements&&this.voidElements.hasOwnProperty(d.toLowerCase()))return;return{text:"></"+d+">",selection:[1,1]}}})),this.add("autoindent","insertion",(function(e,t,n,r,a){if("\n"==a){var l=n.getCursorPosition(),u=r.getLine(l.row),s=new o(r,l.row,l.column),g=s.getCurrentToken();if(i(g,"")&&-1!==g.type.indexOf("tag-close")){if("/>"==g.value)return;for(;g&&-1===g.type.indexOf("tag-name");)g=s.stepBackward();if(!g)return;var c=g.value,m=s.getCurrentTokenRow();if(!(g=s.stepBackward())||-1!==g.type.indexOf("end-tag"))return;if(this.voidElements&&!this.voidElements[c]||!this.voidElements){var x=r.getTokenAt(l.row,l.column+1),d=(u=r.getLine(m),this.$getIndent(u)),h=d+r.getTabString();return x&&"</"===x.value?{text:"\n"+h+"\n"+d,selection:[1,h.length,1,h.length]}:{text:"\n"+h}}}}}))};r.inherits(l,a),t.XmlBehaviour=l})),ace.define("ace/mode/folding/xml",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"],(function(e,t,n){"use strict";var r=e("../../lib/oop"),a=e("../../range").Range,o=e("./fold_mode").FoldMode,i=t.FoldMode=function(e,t){o.call(this),this.voidElements=e||{},this.optionalEndTags=r.mixin({},this.voidElements),t&&r.mixin(this.optionalEndTags,t)};r.inherits(i,o);var l=function(){this.tagName="",this.closing=!1,this.selfClosing=!1,this.start={row:0,column:0},this.end={row:0,column:0}};function u(e,t){return e.type.lastIndexOf(t+".xml")>-1}(function(){this.getFoldWidget=function(e,t,n){var r=this._getFirstTagInLine(e,n);return r?r.closing||!r.tagName&&r.selfClosing?"markbeginend"===t?"end":"":!r.tagName||r.selfClosing||this.voidElements.hasOwnProperty(r.tagName.toLowerCase())||this._findEndTagInLine(e,n,r.tagName,r.end.column)?"":"start":this.getCommentFoldWidget(e,n)},this.getCommentFoldWidget=function(e,t){return/comment/.test(e.getState(t))&&/<!-/.test(e.getLine(t))?"start":""},this._getFirstTagInLine=function(e,t){for(var n=e.getTokens(t),r=new l,a=0;a<n.length;a++){var o=n[a];if(u(o,"tag-open")){if(r.end.column=r.start.column+o.value.length,r.closing=u(o,"end-tag-open"),!(o=n[++a]))return null;if(r.tagName=o.value,""===o.value){if(!(o=n[++a]))return null;r.tagName=o.value}for(r.end.column+=o.value.length,a++;a<n.length;a++)if(o=n[a],r.end.column+=o.value.length,u(o,"tag-close")){r.selfClosing="/>"==o.value;break}return r}if(u(o,"tag-close"))return r.selfClosing="/>"==o.value,r;r.start.column+=o.value.length}return null},this._findEndTagInLine=function(e,t,n,r){for(var a=e.getTokens(t),o=0,i=0;i<a.length;i++){var l=a[i];if(!((o+=l.value.length)<r-1)&&u(l,"end-tag-open")&&(u(l=a[i+1],"tag-name")&&""===l.value&&(l=a[i+2]),l&&l.value==n))return!0}return!1},this.getFoldWidgetRange=function(e,t,n){if(!this._getFirstTagInLine(e,n))return this.getCommentFoldWidget(e,n)&&e.getCommentFoldRange(n,e.getLine(n).length);var r=e.getMatchingTags({row:n,column:0});return r?new a(r.openTag.end.row,r.openTag.end.column,r.closeTag.start.row,r.closeTag.start.column):void 0}}).call(i.prototype)})),ace.define("ace/mode/xml",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/mode/text","ace/mode/xml_highlight_rules","ace/mode/behaviour/xml","ace/mode/folding/xml","ace/worker/worker_client"],(function(e,t,n){"use strict";var r=e("../lib/oop"),a=e("../lib/lang"),o=e("./text").Mode,i=e("./xml_highlight_rules").XmlHighlightRules,l=e("./behaviour/xml").XmlBehaviour,u=e("./folding/xml").FoldMode,s=e("../worker/worker_client").WorkerClient,g=function(){this.HighlightRules=i,this.$behaviour=new l,this.foldingRules=new u};r.inherits(g,o),function(){this.voidElements=a.arrayToMap([]),this.blockComment={start:"\x3c!--",end:"--\x3e"},this.createWorker=function(e){var t=new s(["ace"],"ace/mode/xml_worker","Worker");return t.attachToDocument(e.getDocument()),t.on("error",(function(t){e.setAnnotations(t.data)})),t.on("terminate",(function(){e.clearAnnotations()})),t},this.$id="ace/mode/xml"}.call(g.prototype),t.Mode=g})),ace.require(["ace/mode/xml"],(function(t){e&&(e.exports=t)}))}}]);