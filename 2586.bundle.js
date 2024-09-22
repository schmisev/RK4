(self.webpackChunkrobot_karol_4=self.webpackChunkrobot_karol_4||[]).push([[2586],{2586:(e,t,i)=>{e=i.nmd(e),ace.define("ace/mode/mips_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"],(function(e,t,i){"use strict";var n=e("../lib/oop"),s=e("./text_highlight_rules").TextHighlightRules,o=function(){var e=/\\(?:['"?\\abfnrtv]|[0-7]{1,3}|x[a-fA-F\d]{2}|u[a-fA-F\d]{4}U[a-fA-F\d]{8}|.)/.source;this.$rules={start:[{token:"storage.modifier.mips",regex:/\.\b(?:align|ascii|asciiz|byte|double|extern|float|globl|space|word)\b/,comment:"Assembler directives for data storage"},{token:"entity.name.section.mips",regex:/\.\b(?:data|text|kdata|ktext|)\b/,comment:"Segements: .data .text"},{token:"variable.parameter.mips",regex:/\$(?:(?:3[01]|[12]?[0-9]|[0-9])|zero|at|v[01]|a[0-3]|s[0-7]|t[0-9]|k[01]|gp|sp|fp|ra)/,comment:"Registers by id $1, $2, ..."},{token:"variable.parameter.mips",regex:/\$f(?:[0-9]|[1-2][0-9]|3[0-1])/,comment:"Floating point registers"},{token:"support.function.source.mips",regex:/\b(?:(?:add|sub|div|l|mov|mult|neg|s|c\.eq|c\.le|c\.lt)\.[ds]|cvt\.s\.[dw]|cvt\.d\.[sw]|cvt\.w\.[ds]|bc1[tf])\b/,comment:"The MIPS floating-point instruction set"},{token:"support.function.source.mips",regex:/\b(?:add|addu|addi|addiu|sub|subu|and|andi|or|not|ori|nor|xor|xori|slt|sltu|slti|sltiu|sll|sllv|rol|srl|sra|srlv|ror|j|jr|jal|beq|bne|lw|sw|lb|sb|lui|move|mfhi|mflo|mthi|mtlo)\b/,comment:"Just the hardcoded instructions provided by the MIPS assembly language"},{token:"support.function.other.mips",regex:/\b(?:abs|b|beqz|bge|bgt|bgtu|ble|bleu|blt|bltu|bnez|div|divu|la|li|move|mul|neg|not|rem|remu|seq|sge|sgt|sle|sne)\b/,comment:"Pseudo instructions"},{token:"entity.name.function.mips",regex:/\bsyscall\b/,comment:"Other"},{token:"string",regex:"(?:'\")(?:"+e+"|.)?(?:'\")"},{token:"string.start",regex:"'",stateName:"qstring",next:[{token:"string",regex:/\\\s*$/,next:"qqstring"},{token:"constant.language.escape",regex:e},{token:"string.end",regex:"'|$",next:"start"},{defaultToken:"string"}]},{token:"string.start",regex:'"',stateName:"qqstring",next:[{token:"string",regex:/\\\s*$/,next:"qqstring"},{token:"constant.language.escape",regex:e},{token:"string.end",regex:'"|$',next:"start"},{defaultToken:"string"}]},{token:"constant.numeric.mips",regex:/\b(?:\d+|0(?:x|X)[a-fA-F0-9]+)\b/,comment:"Numbers like +12, -3, 55, 0x3F"},{token:"entity.name.tag.mips",regex:/\b[\w]+\b:/,comment:"Labels at line start: begin_repeat: add ..."},{token:"comment.assembly",regex:/#.*$/,comment:"Single line comments"}]},this.normalizeRules()};o.metaData={fileTypes:["s","asm"],name:"MIPS",scopeName:"source.mips"},n.inherits(o,s),t.MIPSHighlightRules=o})),ace.define("ace/mode/folding/cstyle",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"],(function(e,t,i){"use strict";var n=e("../../lib/oop"),s=e("../../range").Range,o=e("./fold_mode").FoldMode,r=t.FoldMode=function(e){e&&(this.foldingStartMarker=new RegExp(this.foldingStartMarker.source.replace(/\|[^|]*?$/,"|"+e.start)),this.foldingStopMarker=new RegExp(this.foldingStopMarker.source.replace(/\|[^|]*?$/,"|"+e.end)))};n.inherits(r,o),function(){this.foldingStartMarker=/([\{\[\(])[^\}\]\)]*$|^\s*(\/\*)/,this.foldingStopMarker=/^[^\[\{\(]*([\}\]\)])|^[\s\*]*(\*\/)/,this.singleLineBlockCommentRe=/^\s*(\/\*).*\*\/\s*$/,this.tripleStarBlockCommentRe=/^\s*(\/\*\*\*).*\*\/\s*$/,this.startRegionRe=/^\s*(\/\*|\/\/)#?region\b/,this._getFoldWidgetBase=this.getFoldWidget,this.getFoldWidget=function(e,t,i){var n=e.getLine(i);if(this.singleLineBlockCommentRe.test(n)&&!this.startRegionRe.test(n)&&!this.tripleStarBlockCommentRe.test(n))return"";var s=this._getFoldWidgetBase(e,t,i);return!s&&this.startRegionRe.test(n)?"start":s},this.getFoldWidgetRange=function(e,t,i,n){var s,o=e.getLine(i);if(this.startRegionRe.test(o))return this.getCommentRegionBlock(e,o,i);if(s=o.match(this.foldingStartMarker)){var r=s.index;if(s[1])return this.openingBracketBlock(e,s[1],i,r);var a=e.getCommentFoldRange(i,r+s[0].length,1);return a&&!a.isMultiLine()&&(n?a=this.getSectionRange(e,i):"all"!=t&&(a=null)),a}return"markbegin"!==t&&(s=o.match(this.foldingStopMarker))?(r=s.index+s[0].length,s[1]?this.closingBracketBlock(e,s[1],i,r):e.getCommentFoldRange(i,r,-1)):void 0},this.getSectionRange=function(e,t){for(var i=e.getLine(t),n=i.search(/\S/),o=t,r=i.length,a=t+=1,l=e.getLength();++t<l;){var g=(i=e.getLine(t)).search(/\S/);if(-1!==g){if(n>g)break;var m=this.getFoldWidgetRange(e,"all",t);if(m){if(m.start.row<=o)break;if(m.isMultiLine())t=m.end.row;else if(n==g)break}a=t}}return new s(o,r,a,e.getLine(a).length)},this.getCommentRegionBlock=function(e,t,i){for(var n=t.search(/\s*$/),o=e.getLength(),r=i,a=/^\s*(?:\/\*|\/\/|--)#?(end)?region\b/,l=1;++i<o;){t=e.getLine(i);var g=a.exec(t);if(g&&(g[1]?l--:l++,!l))break}if(i>r)return new s(r,n,i,t.length)}}.call(r.prototype)})),ace.define("ace/mode/mips",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/mips_highlight_rules","ace/mode/folding/cstyle"],(function(e,t,i){"use strict";var n=e("../lib/oop"),s=e("./text").Mode,o=e("./mips_highlight_rules").MIPSHighlightRules,r=e("./folding/cstyle").FoldMode,a=function(){this.HighlightRules=o,this.foldingRules=new r};n.inherits(a,s),function(){this.lineCommentStart=["#"],this.$id="ace/mode/mips"}.call(a.prototype),t.Mode=a})),ace.require(["ace/mode/mips"],(function(t){e&&(e.exports=t)}))}}]);