/*borschik:include:../../libs/bem-core/node_modules/ym/modules.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/i-bem/i-bem.vanilla.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/i-bem/__internal/i-bem__internal.vanilla.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/inherit/inherit.vanilla.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/identify/identify.vanilla.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/next-tick/next-tick.vanilla.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/objects/objects.vanilla.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/functions/functions.vanilla.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/events/events.vanilla.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/i-bem/__dom/i-bem__dom.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/jquery/jquery.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/loader/_type/loader_type_js.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/jquery/__config/jquery__config.js*/;
/*borschik:include:../../libs/bem-core/desktop.blocks/jquery/__config/jquery__config.js*/;
/*borschik:include:../../libs/bem-core/desktop.blocks/ua/ua.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/dom/dom.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/i-bem/__dom/_init/i-bem__dom_init.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/i-bem/__dom/_init/i-bem__dom_init_auto.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/radio-group/radio-group.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/radio/radio.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointerclick.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointernative.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointerpressrelease.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/control/control.js*/;
/*borschik:include:../../libs/bem-components/desktop.blocks/control/control.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/radio/_type/radio_type_button.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/button/button.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/keyboard/__codes/keyboard__codes.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/input/input.js*/;
/*borschik:include:../../libs/bem-components/desktop.blocks/input/input.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/tick/tick.vanilla.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/idle/idle.js*/;
/*borschik:include:../../desktop.blocks/manager/manager.browser.js*/;
/*borschik:include:../../common.blocks/path-normalizer/path-normalizer.browser.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/vow/vow.vanilla.js*/;
/*borschik:include:../../common.blocks/state/state.browser.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/events/__channels/events__channels.vanilla.js*/;
/*borschik:include:../../common.blocks/size/size.vanilla.js*/;
/*borschik:include:../../common.blocks/state-controller/state-controller.browser.js*/;
/*borschik:include:../../common.blocks/config/config.vanilla.js*/;
/*borschik:include:../../common.blocks/request/request.browser.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/querystring/querystring.vanilla.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/querystring/__uri/querystring__uri.vanilla.js*/;
/*borschik:include:../../common.blocks/vow-queue/vow-queue.vanilla.js*/;
/*borschik:include:../../desktop.blocks/panel/panel.browser.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/cookie/cookie.js*/;
/*borschik:include:../../common.blocks/path/path.browser.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/functions/__debounce/functions__debounce.vanilla.js*/;
/*borschik:include:../../common.blocks/sort/sort.browser.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/menu/menu.js*/;
/*borschik:include:../../common.blocks/menu/menu.browser.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/menu-item/menu-item.js*/;
/*borschik:include:../../common.blocks/menu-item/menu-item.browser.js*/;
/*borschik:include:../../common.blocks/details/details.browser.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/menu/_mode/menu_mode.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/menu/_mode/menu_mode_check.js*/;
/*borschik:include:../../desktop.blocks/divider/divider.browser.js*/;
/*borschik:include:../../common.blocks/disabler/disabler.browser.js*/;
/*borschik:include:../../common.blocks/confirm/confirm.browser.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/popup/popup.js*/;
/*borschik:include:../../libs/bem-core/common.blocks/functions/__throttle/functions__throttle.vanilla.js*/;
/*borschik:include:../../libs/bem-components/design/common.blocks/popup/_theme/popup_theme_islands.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/popup/_target/popup_target.js*/;
/*borschik:include:../../libs/bem-components/common.blocks/popup/_target/popup_target_position.js*/;
/*borschik:include:../../common.blocks/question/question.browser.js*/;
/*borschik:include:../../common.blocks/info/info.browser.js*/;
/*borschik:include:../../common.blocks/status/status.browser.js*/;
(function(g) {
  var __bem_xjst = (function(exports) {
     var __$ref={};function apply(ctx){try{return applyc(ctx||this,__$ref)}catch(e){(ctx||this).xjstContext=e;throw e}}exports.apply=apply;function applyc(__$ctx,__$ref){var __$t=__$ctx._mode;if(__$t==="attrs"){var __$r=__$g0(__$ctx,__$ref);if(__$r!==__$ref)return __$r}else if(__$t==="tag"){var __$r=__$g1(__$ctx,__$ref);if(__$r!==__$ref)return __$r}else if(__$t==="content"){var __$r=__$g2(__$ctx,__$ref);if(__$r!==__$ref)return __$r}else if(__$t==="default"){var __$t=__$ctx.block;if(__$t==="input"){if(!__$ctx.elem&&__$ctx.__$a!==1){__$ctx.__$a=0;var __$r=__$b36(__$ctx,__$ref);if(__$r!==__$ref)return __$r}}else if(__$t==="menu"){if(!__$ctx.elem&&__$ctx.__$a!==8){__$ctx.__$a=0;var __$r=__$b37(__$ctx,__$ref);if(__$r!==__$ref)return __$r}}else if(__$t==="menu-item"){if(!__$ctx.elem&&__$ctx._menuMods&&__$ctx.__$a!==7){__$ctx.__$a=0;var __$r=__$b38(__$ctx,__$ref);if(__$r!==__$ref)return __$r}}__$ctx.__$a=0;var __$r=__$b39(__$ctx,__$ref);if(__$r!==__$ref)return __$r}else if(__$t==="js"){var __$r=__$g3(__$ctx,__$ref);if(__$r!==__$ref)return __$r}else if(__$t==="bem"){var __$t=__$ctx.block;if(__$t==="path-normalizer"){if(!__$ctx.elem){__$ctx.__$a=0;return false}}else if(__$t==="ua"){if(!__$ctx.elem){__$ctx.__$a=0;return false}}__$ctx.__$a=0;return undefined}else if(__$t==="mix"){var __$t=__$ctx.block;if(__$t==="button"){if(!__$ctx.elem){__$ctx.__$a=0;return{elem:"control"}}}else if(__$t==="menu"){if(!__$ctx.elem){__$ctx.__$a=0;return[{elem:"control"}]}}__$ctx.__$a=0;return undefined}else if(__$t==="cls"){__$ctx.__$a=0;return undefined}else if(__$t===""){if(__$ctx.ctx&&__$ctx.ctx._vow&&__$ctx.__$a!==9){__$ctx.__$a=0;var __$r=__$b55(__$ctx,__$ref);if(__$r!==__$ref)return __$r}if(__$ctx.isSimple(__$ctx.ctx)){__$ctx.__$a=0;var __$r=__$b56(__$ctx,__$ref);if(__$r!==__$ref)return __$r}if(!__$ctx.ctx){__$ctx.__$a=0;var __$r=__$b57(__$ctx,__$ref);if(__$r!==__$ref)return __$r}if(__$ctx.isArray(__$ctx.ctx)){__$ctx.__$a=0;var __$r=__$b58(__$ctx,__$ref);if(__$r!==__$ref)return __$r}__$ctx.__$a=0;var __$r=__$b59(__$ctx,__$ref);if(__$r!==__$ref)return __$r}__$ctx.__$a=0}[function(exports,context){var undef,BEM_={},toString=Object.prototype.toString,slice=Array.prototype.slice,isArray=Array.isArray||function(obj){return toString.call(obj)==="[object Array]"},SHORT_TAGS={area:1,base:1,br:1,col:1,command:1,embed:1,hr:1,img:1,input:1,keygen:1,link:1,meta:1,param:1,source:1,wbr:1};!function(BEM,undefined){var MOD_DELIM="_",ELEM_DELIM="__",NAME_PATTERN="[a-zA-Z0-9-]+";function buildModPostfix(modName,modVal){var res=MOD_DELIM+modName;if(modVal!==true)res+=MOD_DELIM+modVal;return res}function buildBlockClass(name,modName,modVal){var res=name;if(modVal)res+=buildModPostfix(modName,modVal);return res}function buildElemClass(block,name,modName,modVal){var res=buildBlockClass(block)+ELEM_DELIM+name;if(modVal)res+=buildModPostfix(modName,modVal);return res}BEM.INTERNAL={NAME_PATTERN:NAME_PATTERN,MOD_DELIM:MOD_DELIM,ELEM_DELIM:ELEM_DELIM,buildModPostfix:buildModPostfix,buildClass:function(block,elem,modName,modVal){var typeOfModName=typeof modName;if(typeOfModName==="string"||typeOfModName==="boolean"){var typeOfModVal=typeof modVal;if(typeOfModVal!=="string"&&typeOfModVal!=="boolean"){modVal=modName;modName=elem;elem=undef}}else if(typeOfModName!=="undefined"){modName=undef}else if(elem&&typeof elem!=="string"){elem=undef}if(!(elem||modName)){return block}return elem?buildElemClass(block,elem,modName,modVal):buildBlockClass(block,modName,modVal)},buildModsClasses:function(block,elem,mods){var res="";if(mods){var modName;for(modName in mods){if(!mods.hasOwnProperty(modName))continue;var modVal=mods[modName];if(!modVal&&modVal!==0)continue;typeof modVal!=="boolean"&&(modVal+="");res+=" "+(elem?buildElemClass(block,elem,modName,modVal):buildBlockClass(block,modName,modVal))}}return res},buildClasses:function(block,elem,mods){var res="";res+=elem?buildElemClass(block,elem):buildBlockClass(block);res+=this.buildModsClasses(block,elem,mods);return res}}}(BEM_);var ts={'"':"&quot;","&":"&amp;","<":"&lt;",">":"&gt;"},f=function(t){return ts[t]||t};var buildEscape=function(r){r=new RegExp(r,"g");return function(s){return(""+s).replace(r,f)}};context.BEMContext=BEMContext;function BEMContext(context,apply_){this.ctx=typeof context==="undefined"?"":context;this.apply=apply_;this._str="";var _this=this;this._buf={push:function(){var chunks=slice.call(arguments).join("");_this._str+=chunks},join:function(){return this._str}};this._=this;this._start=true;this._mode="";this._listLength=0;this._notNewList=false;this.position=0;this.block=undef;this.elem=undef;this.mods=undef;this.elemMods=undef}BEMContext.prototype.isArray=isArray;BEMContext.prototype.isSimple=function isSimple(obj){if(!obj||obj===true)return true;var t=typeof obj;return t==="string"||t==="number"};BEMContext.prototype.isShortTag=function isShortTag(t){return SHORT_TAGS.hasOwnProperty(t)};BEMContext.prototype.extend=function extend(o1,o2){if(!o1||!o2)return o1||o2;var res={},n;for(n in o1)o1.hasOwnProperty(n)&&(res[n]=o1[n]);for(n in o2)o2.hasOwnProperty(n)&&(res[n]=o2[n]);return res};var cnt=0,id=+new Date,expando="__"+id,get=function(){return"uniq"+id+ ++cnt};BEMContext.prototype.identify=function(obj,onlyGet){if(!obj)return get();if(onlyGet||obj[expando]){return obj[expando]}else{return obj[expando]=get()}};BEMContext.prototype.xmlEscape=buildEscape("[&<>]");BEMContext.prototype.attrEscape=buildEscape('["&<>]');BEMContext.prototype.BEM=BEM_;BEMContext.prototype.isFirst=function isFirst(){return this.position===1};BEMContext.prototype.isLast=function isLast(){return this.position===this._listLength};BEMContext.prototype.generateId=function generateId(){return this.identify(this.ctx)};var oldApply=exports.apply;exports.apply=BEMContext.apply=function BEMContext_apply(context){var ctx=new BEMContext(context||this,oldApply);ctx.apply();return ctx._str};BEMContext.prototype.reapply=BEMContext.apply}].forEach(function(fn){fn(exports,this)},{recordExtensions:function(ctx){ctx._input=undefined;ctx.__$a=0;ctx._menuMods=undefined;ctx._str=undefined;ctx._mode=undefined;ctx.block=undefined;ctx.elem=undefined;ctx._notNewList=undefined;ctx.position=undefined;ctx._listLength=undefined;ctx.ctx=undefined;ctx._currBlock=undefined;ctx.mods=undefined;ctx.elemMods=undefined}});function __$b1(__$ctx,__$ref){__$ctx.__$a=0;var input__$0=__$ctx._input,attrs__$1={id:input__$0.id,name:input__$0.name,value:input__$0.val,maxlength:input__$0.maxLength,tabindex:input__$0.tabIndex,placeholder:input__$0.placeholder};input__$0.autocomplete===false&&(attrs__$1.autocomplete="off");__$ctx.mods.disabled&&(attrs__$1.disabled="disabled");return attrs__$1}function __$b2(__$ctx,__$ref){__$ctx.__$a=0;var ctx__$8=__$ctx.ctx,attrs__$9={type:__$ctx.mods.type||"button",name:ctx__$8.name,value:ctx__$8.val};__$ctx.mods.disabled&&(attrs__$9.disabled="disabled");return __$ctx.extend(function(){var __$r__$10;__$ctx.__$a=3;__$r__$10=applyc(__$ctx,__$ref);return __$r__$10}(),attrs__$9)}function __$b3(__$ctx,__$ref){__$ctx.__$a=0;var ctx__$11=__$ctx.ctx;return{role:"button",tabindex:ctx__$11.tabIndex,id:ctx__$11.id,title:ctx__$11.title}}function __$b7(__$ctx,__$ref){__$ctx.__$a=0;var attrs__$17={role:"menu"};__$ctx.mods.disabled||(attrs__$17.tabindex=0);return attrs__$17}function __$b27(__$ctx,__$ref){__$ctx.__$a=0;var ctx__$6=__$ctx.ctx,content__$7=[ctx__$6.icon];"text"in ctx__$6&&content__$7.push({elem:"text",content:ctx__$6.text});return content__$7}function __$b36(__$ctx,__$ref){__$ctx.__$a=0;var __$r__$2;var __$l0__$3=__$ctx._input;__$ctx._input=__$ctx.ctx;var __$r__$4;__$ctx.__$a=1;__$r__$4=applyc(__$ctx,__$ref);__$r__$2=__$r__$4;__$ctx._input=__$l0__$3;return}function __$b37(__$ctx,__$ref){__$ctx.__$a=0;var ctx__$18=__$ctx.ctx,mods__$19=__$ctx.mods,firstItem__$20,checkedItems__$21=[];if(ctx__$18.content){var isValDef__$22=typeof ctx__$18.val!=="undefined",containsVal__$23=function(val){return isValDef__$22&&(mods__$19.mode==="check"?ctx__$18.val.indexOf(val)>-1:ctx__$18.val===val)},iterateItems__$24=function(content){var i__$25=0,itemOrGroup__$26;while(itemOrGroup__$26=content[i__$25++]){if(itemOrGroup__$26.block==="menu-item"){firstItem__$20||(firstItem__$20=itemOrGroup__$26);if(containsVal__$23(itemOrGroup__$26.val)){(itemOrGroup__$26.mods=itemOrGroup__$26.mods||{}).checked=true;checkedItems__$21.push(itemOrGroup__$26)}}else{iterateItems__$24(itemOrGroup__$26.content)}}};if(!__$ctx.isArray(ctx__$18.content))throw Error("menu: content must be an array of the menu items");iterateItems__$24(ctx__$18.content)}__$ctx._firstItem=firstItem__$20;__$ctx._checkedItems=checkedItems__$21;var __$r__$27;var __$l0__$28=__$ctx._menuMods;__$ctx._menuMods={theme:mods__$19.theme,disabled:mods__$19.disabled};var __$r__$29;__$ctx.__$a=8;__$r__$29=applyc(__$ctx,__$ref);__$r__$27=__$r__$29;__$ctx._menuMods=__$l0__$28;return}function __$b38(__$ctx,__$ref){__$ctx.__$a=0;var mods__$15=__$ctx.mods;mods__$15.theme=mods__$15.theme||__$ctx._menuMods.theme;mods__$15.disabled=mods__$15.disabled||__$ctx._menuMods.disabled;var __$r__$16;__$ctx.__$a=7;__$r__$16=applyc(__$ctx,__$ref);return}function __$b39(__$ctx,__$ref){__$ctx.__$a=0;var _this__$30=__$ctx,BEM_INTERNAL__$31=_this__$30.BEM.INTERNAL,ctx__$32=__$ctx.ctx,isBEM__$33,tag__$34,res__$35;var __$r__$36;var __$l0__$37=__$ctx._str;__$ctx._str="";var vBlock__$38=__$ctx.block;var __$r__$39;var __$l1__$40=__$ctx._mode;__$ctx._mode="tag";__$r__$39=applyc(__$ctx,__$ref);__$ctx._mode=__$l1__$40;tag__$34=__$r__$39;typeof tag__$34!=="undefined"||(tag__$34=ctx__$32.tag);typeof tag__$34!=="undefined"||(tag__$34="div");if(tag__$34){var jsParams__$41,js__$42;if(vBlock__$38&&ctx__$32.js!==false){var __$r__$43;var __$l2__$44=__$ctx._mode;__$ctx._mode="js";__$r__$43=applyc(__$ctx,__$ref);__$ctx._mode=__$l2__$44;js__$42=__$r__$43;js__$42=js__$42?__$ctx.extend(ctx__$32.js,js__$42===true?{}:js__$42):ctx__$32.js===true?{}:ctx__$32.js;js__$42&&((jsParams__$41={})[BEM_INTERNAL__$31.buildClass(vBlock__$38,ctx__$32.elem)]=js__$42)}__$ctx._str+="<"+tag__$34;var __$r__$45;var __$l3__$46=__$ctx._mode;__$ctx._mode="bem";__$r__$45=applyc(__$ctx,__$ref);__$ctx._mode=__$l3__$46;isBEM__$33=__$r__$45;typeof isBEM__$33!=="undefined"||(isBEM__$33=typeof ctx__$32.bem!=="undefined"?ctx__$32.bem:ctx__$32.block||ctx__$32.elem);var __$r__$48;var __$l4__$49=__$ctx._mode;__$ctx._mode="cls";__$r__$48=applyc(__$ctx,__$ref);__$ctx._mode=__$l4__$49;var cls__$47=__$r__$48;cls__$47||(cls__$47=ctx__$32.cls);var addJSInitClass__$50=ctx__$32.block&&jsParams__$41;if(isBEM__$33||cls__$47){__$ctx._str+=' class="';if(isBEM__$33){__$ctx._str+=BEM_INTERNAL__$31.buildClasses(vBlock__$38,ctx__$32.elem,ctx__$32.elemMods||ctx__$32.mods);var __$r__$52;var __$l5__$53=__$ctx._mode;__$ctx._mode="mix";__$r__$52=applyc(__$ctx,__$ref);__$ctx._mode=__$l5__$53;var mix__$51=__$r__$52;ctx__$32.mix&&(mix__$51=mix__$51?[].concat(mix__$51,ctx__$32.mix):ctx__$32.mix);if(mix__$51){var visited__$54={},visitedKey__$55=function(block,elem){return(block||"")+"__"+(elem||"")};visited__$54[visitedKey__$55(vBlock__$38,__$ctx.elem)]=true;__$ctx.isArray(mix__$51)||(mix__$51=[mix__$51]);for(var i__$56=0;i__$56<mix__$51.length;i__$56++){var mixItem__$57=mix__$51[i__$56],hasItem__$58=mixItem__$57.block||mixItem__$57.elem,mixBlock__$59=mixItem__$57.block||mixItem__$57._block||_this__$30.block,mixElem__$60=mixItem__$57.elem||mixItem__$57._elem||_this__$30.elem;hasItem__$58&&(__$ctx._str+=" ");__$ctx._str+=BEM_INTERNAL__$31[hasItem__$58?"buildClasses":"buildModsClasses"](mixBlock__$59,mixItem__$57.elem||mixItem__$57._elem||(mixItem__$57.block?undefined:_this__$30.elem),mixItem__$57.elemMods||mixItem__$57.mods);if(mixItem__$57.js){(jsParams__$41||(jsParams__$41={}))[BEM_INTERNAL__$31.buildClass(mixBlock__$59,mixItem__$57.elem)]=mixItem__$57.js===true?{}:mixItem__$57.js;addJSInitClass__$50||(addJSInitClass__$50=mixBlock__$59&&!mixItem__$57.elem)}if(hasItem__$58&&!visited__$54[visitedKey__$55(mixBlock__$59,mixElem__$60)]){visited__$54[visitedKey__$55(mixBlock__$59,mixElem__$60)]=true;var __$r__$62;var __$l6__$63=__$ctx._mode;__$ctx._mode="mix";var __$l7__$64=__$ctx.block;__$ctx.block=mixBlock__$59;var __$l8__$65=__$ctx.elem;__$ctx.elem=mixElem__$60;__$r__$62=applyc(__$ctx,__$ref);__$ctx._mode=__$l6__$63;__$ctx.block=__$l7__$64;__$ctx.elem=__$l8__$65;var nestedMix__$61=__$r__$62;if(nestedMix__$61){for(var j__$66=0;j__$66<nestedMix__$61.length;j__$66++){var nestedItem__$67=nestedMix__$61[j__$66];if(!nestedItem__$67.block&&!nestedItem__$67.elem||!visited__$54[visitedKey__$55(nestedItem__$67.block,nestedItem__$67.elem)]){nestedItem__$67._block=mixBlock__$59;nestedItem__$67._elem=mixElem__$60;mix__$51.splice(i__$56+1,0,nestedItem__$67)}}}}}}}cls__$47&&(__$ctx._str+=isBEM__$33?" "+cls__$47:cls__$47);__$ctx._str+=addJSInitClass__$50?' i-bem"':'"'}if(isBEM__$33&&jsParams__$41){__$ctx._str+=' data-bem="'+__$ctx.attrEscape(JSON.stringify(jsParams__$41))+'"'}var __$r__$69;var __$l9__$70=__$ctx._mode;__$ctx._mode="attrs";__$r__$69=applyc(__$ctx,__$ref);__$ctx._mode=__$l9__$70;var attrs__$68=__$r__$69;attrs__$68=__$ctx.extend(attrs__$68,ctx__$32.attrs);if(attrs__$68){var name__$71,attr__$72;for(name__$71 in attrs__$68){attr__$72=attrs__$68[name__$71];if(typeof attr__$72==="undefined")continue;__$ctx._str+=" "+name__$71+'="'+__$ctx.attrEscape(__$ctx.isSimple(attr__$72)?attr__$72:__$ctx.reapply(attr__$72))+'"'}}}if(__$ctx.isShortTag(tag__$34)){__$ctx._str+="/>"}else{tag__$34&&(__$ctx._str+=">");var __$r__$74;var __$l10__$75=__$ctx._mode;__$ctx._mode="content";__$r__$74=applyc(__$ctx,__$ref);__$ctx._mode=__$l10__$75;var content__$73=__$r__$74;if(content__$73||content__$73===0){isBEM__$33=vBlock__$38||__$ctx.elem;var __$r__$76;var __$l11__$77=__$ctx._mode;__$ctx._mode="";var __$l12__$78=__$ctx._notNewList;__$ctx._notNewList=false;var __$l13__$79=__$ctx.position;__$ctx.position=isBEM__$33?1:__$ctx.position;var __$l14__$80=__$ctx._listLength;__$ctx._listLength=isBEM__$33?1:__$ctx._listLength;var __$l15__$81=__$ctx.ctx;__$ctx.ctx=content__$73;__$r__$76=applyc(__$ctx,__$ref);__$ctx._mode=__$l11__$77;__$ctx._notNewList=__$l12__$78;__$ctx.position=__$l13__$79;__$ctx._listLength=__$l14__$80;__$ctx.ctx=__$l15__$81}tag__$34&&(__$ctx._str+="</"+tag__$34+">")}res__$35=__$ctx._str;__$r__$36=undefined;__$ctx._str=__$l0__$37;__$ctx._buf.push(res__$35);return}function __$b55(__$ctx,__$ref){__$ctx.__$a=0;var __$r__$82;var __$l0__$83=__$ctx._mode;__$ctx._mode="";var __$l1__$84=__$ctx.ctx;__$ctx.ctx=__$ctx.ctx._value;var __$r__$85;__$ctx.__$a=9;__$r__$85=applyc(__$ctx,__$ref);__$r__$82=__$r__$85;__$ctx._mode=__$l0__$83;__$ctx.ctx=__$l1__$84;return}function __$b56(__$ctx,__$ref){__$ctx.__$a=0;__$ctx._listLength--;var ctx__$86=__$ctx.ctx;if(ctx__$86&&ctx__$86!==true||ctx__$86===0){__$ctx._str+=ctx__$86+""}return}function __$b57(__$ctx,__$ref){__$ctx.__$a=0;__$ctx._listLength--;return}function __$b58(__$ctx,__$ref){__$ctx.__$a=0;var ctx__$87=__$ctx.ctx,len__$88=ctx__$87.length,i__$89=0,prevPos__$90=__$ctx.position,prevNotNewList__$91=__$ctx._notNewList;if(prevNotNewList__$91){__$ctx._listLength+=len__$88-1}else{__$ctx.position=0;__$ctx._listLength=len__$88}__$ctx._notNewList=true;while(i__$89<len__$88)!function(){var __$r__$92;var __$l0__$93=__$ctx.ctx;__$ctx.ctx=ctx__$87[i__$89++];__$r__$92=applyc(__$ctx,__$ref);__$ctx.ctx=__$l0__$93;return __$r__$92}();prevNotNewList__$91||(__$ctx.position=prevPos__$90);return}function __$b59(__$ctx,__$ref){__$ctx.__$a=0;__$ctx.ctx||(__$ctx.ctx={});var vBlock__$94=__$ctx.ctx.block,vElem__$95=__$ctx.ctx.elem,block__$96=__$ctx._currBlock||__$ctx.block;var __$r__$97;var __$l0__$98=__$ctx._mode;__$ctx._mode="default";var __$l1__$99=__$ctx.block;__$ctx.block=vBlock__$94||(vElem__$95?block__$96:undefined);var __$l2__$100=__$ctx._currBlock;__$ctx._currBlock=vBlock__$94||vElem__$95?undefined:block__$96;var __$l3__$101=__$ctx.elem;__$ctx.elem=vElem__$95;var __$l4__$102=__$ctx.mods;__$ctx.mods=vBlock__$94?__$ctx.ctx.mods||(__$ctx.ctx.mods={}):__$ctx.mods;var __$l5__$103=__$ctx.elemMods;__$ctx.elemMods=__$ctx.ctx.elemMods||{};__$ctx.block||__$ctx.elem?__$ctx.position=(__$ctx.position||0)+1:__$ctx._listLength--;applyc(__$ctx,__$ref);__$r__$97=undefined;__$ctx._mode=__$l0__$98;__$ctx.block=__$l1__$99;__$ctx._currBlock=__$l2__$100;__$ctx.elem=__$l3__$101;__$ctx.mods=__$l4__$102;__$ctx.elemMods=__$l5__$103;return}function __$g0(__$ctx,__$ref){var __$t=__$ctx.block;if(__$t==="input"){if(__$ctx.elem==="control"){__$ctx.__$a=0;var __$r=__$b1(__$ctx,__$ref);if(__$r!==__$ref)return __$r}}else if(__$t==="button"){var __$t=!__$ctx.elem;if(__$t){if((!__$ctx.mods.type||__$ctx.mods.type==="submit")&&__$ctx.__$a!==3){__$ctx.__$a=0;var __$r=__$b2(__$ctx,__$ref);if(__$r!==__$ref)return __$r}__$ctx.__$a=0;var __$r=__$b3(__$ctx,__$ref);if(__$r!==__$ref)return __$r}}else if(__$t==="menu"){var __$t=__$ctx.elem;if(__$t==="group-title"){__$ctx.__$a=0;return{role:"presentation"}}else if(__$t==="group"){if(typeof __$ctx.ctx.title!=="undefined"&&__$ctx.__$a!==5){__$ctx.__$a=0;var __$r=__$ctx.extend(function(){var __$r__$13;__$ctx.__$a=5;__$r__$13=applyc(__$ctx,__$ref);return __$r__$13}(),{"aria-label":__$ctx.ctx.title});if(__$r!==__$ref)return __$r}__$ctx.__$a=0;return{role:"group"}}if(!__$ctx.elem){__$ctx.__$a=0;var __$r=__$b7(__$ctx,__$ref);if(__$r!==__$ref)return __$r}}else if(__$t==="menu-item"){if(!__$ctx.elem){__$ctx.__$a=0;return{role:"menuitem"}}}__$ctx.__$a=0;return undefined;return __$ref}function __$g1(__$ctx,__$ref){var __$t=__$ctx.block;if(__$t==="input"){var __$t=__$ctx.elem;if(__$t==="control"){__$ctx.__$a=0;return"input"}else if(__$t==="box"){__$ctx.__$a=0;return"span"}if(!__$ctx.elem){__$ctx.__$a=0;return"span"}}else if(__$t==="button"){if(__$ctx.elem==="text"){__$ctx.__$a=0;return"span"}if(!__$ctx.elem){__$ctx.__$a=0;return __$ctx.ctx.tag||"button"}}else if(__$t==="gap"){if(!__$ctx.elem){__$ctx.__$a=0;return"span"}}else if(__$t==="details"){var __$t=__$ctx.elem;if(__$t==="date"){__$ctx.__$a=0;return"td"}else if(__$t==="owner"){__$ctx.__$a=0;return"td"}else if(__$t==="size"){__$ctx.__$a=0;return"td"}else if(__$t==="type"){__$ctx.__$a=0;return"td"}else if(__$t==="name"){__$ctx.__$a=0;return"td"}if(!__$ctx.elem){__$ctx.__$a=0;return"table"}}else if(__$t==="ua"){if(!__$ctx.elem){__$ctx.__$a=0;return"script"}}__$ctx.__$a=0;return undefined;return __$ref}function __$g2(__$ctx,__$ref){var __$t=__$ctx.block;if(__$t==="input"){if(!__$ctx.elem){__$ctx.__$a=0;return{elem:"box",content:{elem:"control"}}}}else if(__$t==="path"){if(!__$ctx.elem){__$ctx.__$a=0;return{block:"input",mods:{theme:"islands",size:"l",width:"available"},name:"path"}}}else if(__$t==="button"){var __$t=!__$ctx.elem;if(__$t){if(typeof __$ctx.ctx.content!=="undefined"){__$ctx.__$a=0;return __$ctx.ctx.content}__$ctx.__$a=0;var __$r=__$b27(__$ctx,__$ref);if(__$r!==__$ref)return __$r}}else if(__$t==="button-wrapper"){if(!__$ctx.elem&&__$ctx.mods&&__$ctx.mods["yesno"]==="true"){__$ctx.__$a=0;return[{block:"button",mods:{theme:"islands",size:"xl",yes:"true"},name:"yes",val:"true",text:"Yes"},{block:"gap"},{block:"button",mods:{theme:"islands",size:"xl",no:"true"},name:"no",val:"false",text:"No"}]}}else if(__$t==="question"){var __$t=!__$ctx.elem;if(__$t){var __$t=__$ctx.mods;if(__$t){if(__$ctx.mods["simple"]==="true"){__$ctx.__$a=0;return[{elem:"message"},{block:"path",mods:{simple:"true"}},{elem:"hint",content:"Choose an existing destination by typing the path."},{block:"button-wrapper",mods:{yesno:"true"}}]}if(__$ctx.mods["with-destination"]==="true"){__$ctx.__$a=0;return[{elem:"message",content:__$ctx.ctx.message?__$ctx.ctx.message:"blah"},{block:"path",mods:{source:"true"}},{elem:"destination-message",content:"to the following destination folder:"},{block:"path",mods:{destination:"true"}},{elem:"hint",content:"Choose an existing destination by typing the path."},{block:"button-wrapper",mods:{yesno:"true"}}]}}__$ctx.__$a=0;return[{elem:"message",content:__$ctx.ctx.message?__$ctx.ctx.message:"blah"},{block:"path",mods:{source:"true"}},{block:"button-wrapper",mods:{yesno:"true"}}]}}else if(__$t==="menu"){if(__$ctx.elem==="group"&&typeof __$ctx.ctx.title!=="undefined"&&__$ctx.__$a!==4){__$ctx.__$a=0;return[{elem:"group-title",content:__$ctx.ctx.title},function(){var __$r__$12;__$ctx.__$a=4;__$r__$12=applyc(__$ctx,__$ref);return __$r__$12}()]}}else if(__$t==="details"){if(!__$ctx.elem){__$ctx.__$a=0;return[{elem:"name",content:__$ctx.ctx.name,mods:{type:__$ctx.ctx.type}},{elem:"type",content:__$ctx.ctx.type},{elem:"size",content:__$ctx.ctx.stats.size},{elem:"owner",content:__$ctx.ctx.stats.uid},{elem:"date",content:__$ctx.ctx.stats.ctime}]}}else if(__$t==="ua"){if(!__$ctx.elem){__$ctx.__$a=0;return["(function(e,c){",'e[c]=e[c].replace(/(ua_js_)no/g,"$1yes");','})(document.documentElement,"className");']}}__$ctx.__$a=0;return __$ctx.ctx.content;return __$ref}function __$g3(__$ctx,__$ref){var __$t=__$ctx.block;if(__$t==="input"){if(!__$ctx.elem){__$ctx.__$a=0;return true}}else if(__$t==="path"){if(!__$ctx.elem){__$ctx.__$a=0;return true}}else if(__$t==="button"){var __$t=!__$ctx.elem;if(__$t){if(__$ctx.mods&&__$ctx.mods["focused"]===true&&__$ctx.__$a!==2){__$ctx.__$a=0;var __$r=__$ctx.extend(function(){var __$r__$5;__$ctx.__$a=2;__$r__$5=applyc(__$ctx,__$ref);return __$r__$5}(),{live:false});if(__$r!==__$ref)return __$r}__$ctx.__$a=0;return true}}else if(__$t==="menu"){var __$t=!__$ctx.elem;if(__$t){if(__$ctx.mods&&__$ctx.mods["focused"]===true&&__$ctx.__$a!==6){__$ctx.__$a=0;var __$r=__$ctx.extend(function(){var __$r__$14;__$ctx.__$a=6;__$r__$14=applyc(__$ctx,__$ref);return __$r__$14}(),{live:false});if(__$r!==__$ref)return __$r}__$ctx.__$a=0;return true}}else if(__$t==="menu-item"){if(!__$ctx.elem){__$ctx.__$a=0;return{val:__$ctx.ctx.val}}}__$ctx.__$a=0;return undefined;return __$ref};
     return exports;
  })({});
  var defineAsGlobal = true;
  if(typeof exports === "object") {
    exports["BEMHTML"] = __bem_xjst;
    defineAsGlobal = false;
  }
  if(typeof modules === "object") {
    modules.define("BEMHTML",
                   function(provide) { provide(__bem_xjst) });
    defineAsGlobal = false;
  }
  defineAsGlobal && (g["BEMHTML"] = __bem_xjst);
})(this);