(self.webpackChunkrobot_karol_4=self.webpackChunkrobot_karol_4||[]).push([[20009],{20009:(t,i,e)=>{t=e.nmd(t),ace.define("ace/split",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/lib/event_emitter","ace/editor","ace/virtual_renderer","ace/edit_session"],(function(t,i,e){"use strict";var s,n=t("./lib/oop"),o=(t("./lib/lang"),t("./lib/event_emitter").EventEmitter),r=t("./editor").Editor,h=t("./virtual_renderer").VirtualRenderer,a=t("./edit_session").EditSession;(function(){n.implement(this,o),this.$createEditor=function(){var t=document.createElement("div");t.className=this.$editorCSS,t.style.cssText="position: absolute; top:0px; bottom:0px",this.$container.appendChild(t);var i=new r(new h(t,this.$theme));return i.on("focus",function(){this._emit("focus",i)}.bind(this)),this.$editors.push(i),i.setFontSize(this.$fontSize),i},this.setSplits=function(t){var i;if(t<1)throw"The number of splits have to be > 0!";if(t!=this.$splits){if(t>this.$splits){for(;this.$splits<this.$editors.length&&this.$splits<t;)i=this.$editors[this.$splits],this.$container.appendChild(i.container),i.setFontSize(this.$fontSize),this.$splits++;for(;this.$splits<t;)this.$createEditor(),this.$splits++}else for(;this.$splits>t;)i=this.$editors[this.$splits-1],this.$container.removeChild(i.container),this.$splits--;this.resize()}},this.getSplits=function(){return this.$splits},this.getEditor=function(t){return this.$editors[t]},this.getCurrentEditor=function(){return this.$cEditor},this.focus=function(){this.$cEditor.focus()},this.blur=function(){this.$cEditor.blur()},this.setTheme=function(t){this.$editors.forEach((function(i){i.setTheme(t)}))},this.setKeyboardHandler=function(t){this.$editors.forEach((function(i){i.setKeyboardHandler(t)}))},this.forEach=function(t,i){this.$editors.forEach(t,i)},this.$fontSize="",this.setFontSize=function(t){this.$fontSize=t,this.forEach((function(i){i.setFontSize(t)}))},this.$cloneSession=function(t){var i=new a(t.getDocument(),t.getMode()),e=t.getUndoManager();return i.setUndoManager(e),i.setTabSize(t.getTabSize()),i.setUseSoftTabs(t.getUseSoftTabs()),i.setOverwrite(t.getOverwrite()),i.setBreakpoints(t.getBreakpoints()),i.setUseWrapMode(t.getUseWrapMode()),i.setUseWorker(t.getUseWorker()),i.setWrapLimitRange(t.$wrapLimitRange.min,t.$wrapLimitRange.max),i.$foldData=t.$cloneFoldData(),i},this.setSession=function(t,i){var e;e=null==i?this.$cEditor:this.$editors[i];var s=this.$editors.some((function(i){return i.session===t}));return s&&(t=this.$cloneSession(t)),e.setSession(t),t},this.getOrientation=function(){return this.$orientation},this.setOrientation=function(t){this.$orientation!=t&&(this.$orientation=t,this.resize())},this.resize=function(){var t,i=this.$container.clientWidth,e=this.$container.clientHeight;if(this.$orientation==this.BESIDE)for(var s=i/this.$splits,n=0;n<this.$splits;n++)(t=this.$editors[n]).container.style.width=s+"px",t.container.style.top="0px",t.container.style.left=n*s+"px",t.container.style.height=e+"px",t.resize();else{var o=e/this.$splits;for(n=0;n<this.$splits;n++)(t=this.$editors[n]).container.style.width=i+"px",t.container.style.top=n*o+"px",t.container.style.left="0px",t.container.style.height=o+"px",t.resize()}}}).call((s=function(t,i,e){this.BELOW=1,this.BESIDE=0,this.$container=t,this.$theme=i,this.$splits=0,this.$editorCSS="",this.$editors=[],this.$orientation=this.BESIDE,this.setSplits(e||1),this.$cEditor=this.$editors[0],this.on("focus",function(t){this.$cEditor=t}.bind(this))}).prototype),i.Split=s})),ace.define("ace/ext/split",["require","exports","module","ace/split"],(function(t,i,e){"use strict";e.exports=t("../split")})),ace.require(["ace/ext/split"],(function(i){t&&(t.exports=i)}))}}]);