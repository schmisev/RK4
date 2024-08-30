ace.define("ace/theme/RKLight-css",["require","exports","module"], function(require, exports, module){
    module.exports = 
    `.ace-RKLight .ace_gutter {
        background: #ebebeb;
        color: #333;
        overflow : hidden;
      }
      
      .ace-RKLight .ace_print-margin {
        width: 1px;
        background: #e8e8e8;
      }
      
      .ace-RKLight {
        background-color: #FFFFFF;
        color: black;
      }
      
      .ace-RKLight .ace_cursor {
        color: black;
      }
      
      .ace-RKLight .ace_invisible {
        color: rgb(191, 191, 191);
      }
      
      .ace-RKLight .ace_constant.ace_buildin {
        color: rgb(88, 72, 246);
      }
      
      .ace-RKLight .ace_constant.ace_language {
        color: rgb(88, 92, 246);
      }
      
      .ace-RKLight .ace_constant.ace_library {
        color: rgb(6, 150, 14);
      }
      
      .ace-RKLight .ace_invalid {
        background-color: rgb(153, 0, 0);
        color: white;
      }
      
      .ace-RKLight .ace_fold {
      }
      
      .ace-RKLight .ace_support.ace_function {
        color: rgb(60, 76, 114);
        font-weight: bold;
      }
      
      .ace-RKLight .ace_support.ace_constant {
        color: rgb(6, 150, 14);
      }
      
      .ace-RKLight .ace_support.ace_type,
      .ace-RKLight .ace_support.ace_class
      .ace-RKLight .ace_support.ace_other {
        color: rgb(109, 121, 222);
        font-weight: bold;
      }
      
      .ace-RKLight .ace_variable.ace_parameter {
        font-style:italic;
        color:#FD971F;
      }
      .ace-RKLight .ace_keyword.ace_operator {
        color: red;
      }
      
      .ace-RKLight .ace_comment {
        color: gray;
      }
      
      .ace-RKLight .ace_comment.ace_doc {
        color: darkgoldenrod;
      }
      
      .ace-RKLight .ace_comment.ace_doc.ace_tag {
        color: gray;
      }
      
      .ace-RKLight .ace_constant.ace_numeric {
        color: rgb(0, 0, 205);
      }
      
      .ace-RKLight .ace_variable {
        color: rgb(49, 132, 149);
      }
      
      .ace-RKLight .ace_xml-pe {
        color: rgb(104, 104, 91);
      }
      
      .ace-RKLight .ace_entity.ace_name.ace_function {
        color: #0000A2;
        font-weight: bold;
      }
      
      
      .ace-RKLight .ace_heading {
        color: rgb(12, 7, 255);
      }
      
      .ace-RKLight .ace_list {
        color:rgb(185, 6, 144);
      }
      
      .ace-RKLight .ace_marker-layer .ace_selection {
        background: rgb(181, 213, 255);
      }
      
      .ace-RKLight .ace_marker-layer .ace_step {
        background: rgb(252, 255, 0);
      }
      
      .ace-RKLight .ace_marker-layer .ace_stack {
        background: rgb(164, 229, 101);
      }
      
      .ace-RKLight .ace_marker-layer .ace_bracket {
        margin: -1px 0 0 -1px;
        border: 1px solid rgb(192, 192, 192);
      }
      
      .ace-RKLight .ace_marker-layer .ace_active-line {
        background: rgba(0, 0, 0, 0.07);
      }
      
      .ace-RKLight .ace_gutter-active-line {
          background-color : #dcdcdc;
      }
      
      .ace-RKLight .ace_marker-layer .ace_selected-word {
        background: rgb(250, 250, 255);
        border: 1px solid rgb(200, 200, 250);
      }
      
      .ace-RKLight .ace_storage,
      .ace-RKLight .ace_keyword,
      .ace-RKLight .ace_meta.ace_tag {
        color: rgb(147, 15, 128);
      }
      
      .ace-RKLight .ace_string.ace_regex {
        color: rgb(255, 0, 0)
      }
      
      .ace-RKLight .ace_string {
        color: green;
      }
      
      .ace-RKLight .ace_entity.ace_other.ace_attribute-name {
        color: black;
        font-weight: bold;
      }
      
      .ace-RKLight .ace_indent-guide {
        background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==") right repeat-y;
      }
        
      .ace-RKLight .ace_indent-guide-active {
        background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAZSURBVHjaYvj///9/hivKyv8BAAAA//8DACLqBhbvk+/eAAAAAElFTkSuQmCC") right repeat-y;
      }
      `;
});

ace.define("ace/theme/RKLight",["require","exports","module","ace/theme/RKLight-css","ace/lib/dom"], function(require, exports, module) {
    exports.isDark = false;
    exports.cssClass = "ace-RKLight";
    exports.cssText = require("./RKLight-css");

    var dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass, false);
});

(function() {
    ace.require(["ace/theme/RKLight"], function(m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();
            