(self.webpackChunkrobot_karol_4=self.webpackChunkrobot_karol_4||[]).push([[94443],{94443:(n,e,t)=>{n=t.nmd(n),ace.define("ace/snippets/rst.snippets",["require","exports","module"],(function(n,e,t){t.exports="# rst\n\nsnippet :\n\t:${1:field name}: ${2:field body}\nsnippet *\n\t*${1:Emphasis}*\nsnippet **\n\t**${1:Strong emphasis}**\nsnippet _\n\t\\`${1:hyperlink-name}\\`_\n\t.. _\\`$1\\`: ${2:link-block}\nsnippet =\n\t${1:Title}\n\t=====${2:=}\n\t${3}\nsnippet -\n\t${1:Title}\n\t-----${2:-}\n\t${3}\nsnippet cont:\n\t.. contents::\n\t\n"})),ace.define("ace/snippets/rst",["require","exports","module","ace/snippets/rst.snippets"],(function(n,e,t){"use strict";e.snippetText=n("./rst.snippets"),e.scope="rst"})),ace.require(["ace/snippets/rst"],(function(e){n&&(n.exports=e)}))}}]);