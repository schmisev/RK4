(self.webpackChunkrk4=self.webpackChunkrk4||[]).push([[87268],{87268:(e,t,r)=>{e=r.nmd(e),ace.define("ace/ext/beautify",["require","exports","module","ace/token_iterator"],(function(e,t,r){"use strict";var a=e("../token_iterator").TokenIterator;function s(e,t){return e.type.lastIndexOf(t+".xml")>-1}t.singletonTags=["area","base","br","col","command","embed","hr","html","img","input","keygen","link","meta","param","source","track","wbr"],t.blockTags=["article","aside","blockquote","body","div","dl","fieldset","footer","form","head","header","html","nav","ol","p","script","section","style","table","tbody","tfoot","thead","ul"],t.formatOptions={lineBreaksAfterCommasInCurlyBlock:!0},t.beautify=function(e){for(var r,o,n,i=new a(e,0,0),c=i.getCurrentToken(),l=e.getTabString(),u=t.singletonTags,m=t.blockTags,p=t.formatOptions||{},f=!1,h=!1,y=!1,g="",b="",d="",k=0,$=0,w=0,v=0,x=0,C=0,T=0,R=0,B=0,O=!1,I=!1,q=!1,_=!1,A={0:0},F=[],S=!1,K=function(){r&&r.value&&"string.regexp"!==r.type&&(r.value=r.value.replace(/^\s*/,""))},L=function(){for(var e=g.length-1;0!=e&&" "===g[e];)e-=1;g=g.slice(0,e+1)},V=function(){g=g.trimRight(),f=!1};null!==c;){if(R=i.getCurrentTokenRow(),i.$rowTokens,r=i.stepForward(),void 0!==c){if(b=c.value,x=0,q="style"===d||"ace/mode/css"===e.$modeId,s(c,"tag-open")?(I=!0,r&&(_=-1!==m.indexOf(r.value)),"</"===b&&(_&&!f&&B<1&&B++,q&&(B=1),x=1,_=!1)):s(c,"tag-close")?I=!1:s(c,"comment.start")?_=!0:s(c,"comment.end")&&(_=!1),I||B||"paren.rparen"!==c.type||"}"!==c.value.substr(0,1)||B++,R!==o&&(B=R,o&&(B-=o)),B){for(V();B>0;B--)g+="\n";f=!0,s(c,"comment")||c.type.match(/^(comment|string)$/)||(b=b.trimLeft())}if(b){if("keyword"===c.type&&b.match(/^(if|else|elseif|for|foreach|while|switch)$/)?(F[k]=b,K(),y=!0,b.match(/^(else|elseif)$/)&&g.match(/\}[\s]*$/)&&(V(),h=!0)):"paren.lparen"===c.type?(K(),"{"===b.substr(-1)&&(y=!0,O=!1,I||(B=1)),"{"===b.substr(0,1)&&(h=!0,"["!==g.substr(-1)&&"["===g.trimRight().substr(-1)?(V(),h=!1):")"===g.trimRight().substr(-1)?V():L())):"paren.rparen"===c.type?(x=1,"}"===b.substr(0,1)&&("case"===F[k-1]&&x++,"{"===g.trimRight().substr(-1)?V():(h=!0,q&&(B+=2))),"]"===b.substr(0,1)&&"}"!==g.substr(-1)&&"}"===g.trimRight().substr(-1)&&(h=!1,v++,V()),")"===b.substr(0,1)&&"("!==g.substr(-1)&&"("===g.trimRight().substr(-1)&&(h=!1,v++,V()),L()):"keyword.operator"!==c.type&&"keyword"!==c.type||!b.match(/^(=|==|===|!=|!==|&&|\|\||and|or|xor|\+=|.=|>|>=|<|<=|=>)$/)?"punctuation.operator"===c.type&&";"===b?(V(),K(),y=!0,q&&B++):"punctuation.operator"===c.type&&b.match(/^(:|,)$/)?(V(),K(),b.match(/^(,)$/)&&T>0&&0===C&&p.lineBreaksAfterCommasInCurlyBlock?B++:(y=!0,f=!1)):"support.php_tag"!==c.type||"?>"!==b||f?s(c,"attribute-name")&&g.substr(-1).match(/^\s$/)?h=!0:s(c,"attribute-equals")?(L(),K()):s(c,"tag-close")?(L(),"/>"===b&&(h=!0)):"keyword"===c.type&&b.match(/^(case|default)$/)&&S&&(x=1):(V(),h=!0):(V(),K(),h=!0,y=!0),f&&(!c.type.match(/^(comment)$/)||b.substr(0,1).match(/^[/#]$/))&&(!c.type.match(/^(string)$/)||b.substr(0,1).match(/^['"@]$/))){if(v=w,k>$)for(v++,n=k;n>$;n--)A[n]=v;else k<$&&(v=A[k]);for($=k,w=v,x&&(v-=x),O&&!C&&(v++,O=!1),n=0;n<v;n++)g+=l}if("keyword"===c.type&&b.match(/^(case|default)$/)?!1===S&&(F[k]=b,k++,S=!0):"keyword"===c.type&&b.match(/^(break)$/)&&F[k-1]&&F[k-1].match(/^(case|default)$/)&&(k--,S=!1),"paren.lparen"===c.type&&(C+=(b.match(/\(/g)||[]).length,T+=(b.match(/\{/g)||[]).length,k+=b.length),"keyword"===c.type&&b.match(/^(if|else|elseif|for|while)$/)?(O=!0,C=0):!C&&b.trim()&&"comment"!==c.type&&(O=!1),"paren.rparen"===c.type)for(C-=(b.match(/\)/g)||[]).length,T-=(b.match(/\}/g)||[]).length,n=0;n<b.length;n++)k--,"}"===b.substr(n,1)&&"case"===F[k]&&k--;"text"==c.type&&(b=b.replace(/\s+$/," ")),h&&!f&&(L(),"\n"!==g.substr(-1)&&(g+=" ")),g+=b,y&&(g+=" "),f=!1,h=!1,y=!1,(s(c,"tag-close")&&(_||-1!==m.indexOf(d))||s(c,"doctype")&&">"===b)&&(B=_&&r&&"</"===r.value?-1:1),r&&-1===u.indexOf(r.value)&&(s(c,"tag-open")&&"</"===b?k--:s(c,"tag-open")&&"<"===b?k++:s(c,"tag-close")&&"/>"===b&&k--),s(c,"tag-name")&&(d=b),o=R}}c=r}g=g.trim(),e.doc.setValue(g)},t.commands=[{name:"beautify",description:"Format selection (Beautify)",exec:function(e){t.beautify(e.session)},bindKey:"Ctrl-Shift-B"}]})),ace.require(["ace/ext/beautify"],(function(t){e&&(e.exports=t)}))}}]);