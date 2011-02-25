/*
 * rep.js - Javascript SVG parser for extending the specification with <Replicate>
 * http://code.google.com/p/svg-replicate/
 *
 * Requires: rgbcolor.js - http://www.phpied.com/rgb-color-parser-in-javascript/
 */
var xmlns="http://www.w3.org/2000/svg";
var xlink="http://www.w3.org/1999/xlink";
var svgr="http://granite.sru.edu/svgr";
var xhtmlNS = "http://www.w3.org/1999/xhtml";
root=document.documentElement;
scriptFilePath = "svg-replicate/";

// dynamically load required .js file(s)
loadFile(scriptFilePath + "rgbcolor.js", "js")

function init(evt){
	var ReplicateElements=document.getElementsByTagNameNS(svgr,"replicate");
	if(ReplicateElements.length==0){
		svgr=xmlns;
		ReplicateElements=document.getElementsByTagNameNS(svgr,"replicate");
	}
	for (var i=0;i<ReplicateElements.length;i++){
		replicate(ReplicateElements.item(i), i);
	}
	// replacing the root with a clone works around non-starting animation bug in Opera 10.60
	// if (window.opera) {
		// var newRoot=root.cloneNode(true);
		// document.removeChild(root);
		// document.appendChild(newRoot);
		// root=document.documentElement;
	// }
	// var animateElements = root.getElementsByTagNameNS("xmlns", "animate");
	// for (var i = 0; i < animateElements.length; i++) {
		// animateElements.item(i).beginElement();
	// }
}

var startup = init;
 
function replicate(ReplicateItem, k){
	var Original=ReplicateItem.parentNode; // the parent of the <replicate> is the node to be cloned
	var ReplicateItemNextSibling;
	if (ReplicateItem.nextSibling) ReplicateItemNextSibling=ReplicateItem.nextSibling;
	Original.removeChild(ReplicateItem);   // remove the <replicate> to prevent it from being cloned
	var ReplicateAttributeElements=ReplicateItem.getElementsByTagNameNS(svgr,"replicateAttribute");
	var ReplicatePathElements=ReplicateItem.getElementsByTagNameNS(svgr,"replicatePath");
	var ReplicateModifierElements=ReplicateItem.getElementsByTagNameNS(svgr,"replicateModifier");
 
	var OriginalNextSibling;
	if (Original.nextSibling) OriginalNextSibling=Original.nextSibling;
	var repeatCount=ReplicateItem.getAttribute("repeatCount");
 
	for (var n=0;n<repeatCount;n++){
		var Clone=Original.cloneNode("true");
		(Original.id) ? Clone.setAttribute("id",Original.id+"-"+n) : Clone.setAttribute("id","r"+k+"-"+n);
		var t;
		for (var i=0;i<ReplicateAttributeElements.length;i++){
			var ReplicateAttributeItem=ReplicateAttributeElements.item(i);
			if(ReplicateAttributeItem.hasAttribute("keySplines")) t=getKeySplineTime(ReplicateAttributeItem.getAttribute("keySplines").split(/[ *, *]|[ *]/g), t);
			else t=n/repeatCount;
			var value=getValue(ReplicateAttributeItem, t);
			Clone.setAttributeNS(null, ReplicateAttributeItem.getAttributeNS(null,"attributeName"), value);
		}
		for (var i=0;i<ReplicatePathElements.length;i++){
			var ReplicatePathItem=ReplicatePathElements.item(i);
			if(ReplicatePathItem.hasAttribute("keySplines")) t=getKeySplineTime(ReplicatePathItem.getAttribute("keySplines").split(/[ *, *]|[ *]/g), t);
			else t=n/repeatCount;
			var Baseid=ReplicatePathItem.getAttribute("xlink:href");
			if (Baseid==null) var Baseid=ReplicatePathItem.getAttributeNS(xlink,"xlink:href");
			var PathElement=document.getElementById(Baseid.substring(1,Baseid.length));
			var Point=PathElement.getPointAtLength(PathElement.getTotalLength()*t);
			Clone.setAttributeNS(null, ReplicatePathItem.getAttributeNS(null,"xattribute"), Point.x);
			Clone.setAttributeNS(null, ReplicatePathItem.getAttributeNS(null,"yattribute"), Point.y);
		}
		for (var i=0;i<ReplicateModifierElements.length;i++){
			var ReplicateModifierItem=ReplicateModifierElements.item(i);
			if(ReplicateModifierItem.hasAttribute("keySplines")) t=getKeySplineTime(ReplicateModifierItem.getAttribute("keySplines").split(/[ *, *]|[ *]/g), t);
			else t=n/repeatCount;
			var modifierType=ReplicateModifierItem.getAttributeNS(null,"modifierType");
			if (modifierType=="filter"){}
			else if (modifierType=="animate"){
				var Cnum=ReplicateModifierItem.getAttributeNS(null,"childNum");
				if(isNaN(parseInt(Cnum))) Cnum=ReplicateModifierItem.getAttributeNS(null,"childnum");
				var allAnims=Original.getElementsByTagName("animate");
				var properAnim=allAnims.item(Cnum);
				var value=getValue(ReplicateModifierItem, t);
				properAnim.setAttributeNS(null, ReplicateModifierItem.getAttribute("attributeName"), value);
			}
			else{	//access modifier through fill (eg: fill="url(#g1)")
				var fillurl=Original.getAttribute("fill");
				var reference=fillurl.split(/[#)]/g)[1];
				var newId=reference+"-"+k+"-"+n;
				if(document.getElementById(newId)) var newFill=document.getElementById(newId);
				else{
					var referent=document.getElementById(reference);
					var newFill=referent.cloneNode("true");
					newFill.setAttribute("id",newId);
					var ReferentNextSibling;
					if (referent.nextSibling) ReferentNextSibling=referent.nextSibling;
				}
				if ((modifierType=="linearGradient")||((modifierType=="radialGradient"))){
					if (referent.nodeName!=modifierType) return false;
					var value=getValue(ReplicateModifierItem, t);
					newFill.setAttributeNS(null, ReplicateModifierItem.getAttribute("attributeName"), value);
					Clone.setAttributeNS(null, "fill", "url(#"+newId+")");			
				}
				if (modifierType=="gradientStop"){
				//something like <replicateModifier modifierType="linearGradientStop"  childNum="2" attributeName="offset"  values=".05; .95; .05" />
					var Cnum=ReplicateModifierItem.getAttributeNS(null,"childNum");
					var allStops=newFill.getElementsByTagName("stop");
					var properStop=allStops.item(Cnum);
					var value=getValue(ReplicateModifierItem, t);
					properStop.setAttributeNS(null, ReplicateModifierItem.getAttribute("attributeName"), value);
					Clone.setAttributeNS(null, "fill", "url(#"+newId+")");
				}
				if(ReferentNextSibling) referent.parentNode.insertBefore(newFill, ReferentNextSibling);
				else referent.parentNode.appendChild(newFill);
				// action: handle patterns
			}
		}
		if(OriginalNextSibling) Original.parentNode.insertBefore(Clone, OriginalNextSibling);
		else Original.parentNode.appendChild(Clone);
	}
	if(ReplicateItemNextSibling) Original.insertBefore(ReplicateItem, ReplicateItemNextSibling);
	else Original.appendChild(ReplicateItem);
}

function getKeySplineTime(S, t){
		return 3*t*(1-t)*(1-t)*S[1]+3*t*t*(1-t)*S[3]+t*t*t;
}

function getValue(Rep,t){
	var value=new Array();
	if (Rep.hasAttribute("values")){
		var V=Rep.getAttribute("values").replace(/^\s+|\s+$/g,"").split(/\s*;\s*/g);
		var valueprop=(V.length-1)*t;
		var firstindex=(Math.floor(valueprop)<V.length-1)? Math.floor(valueprop) : V.length-2;
		var F=V[firstindex].match(/[^\d-\.]+|-?\d*\.?\d+/g);
		var T=V[firstindex+1].match(/[^\d-\.]+|-?\d*\.?\d+/g);
		var t=valueprop-firstindex;
	}
	else if (Rep.hasAttribute("from")){
		// Handle named and Hex colors.
		if(Rep.getAttribute("attributeName")=="fill" || Rep.getAttribute("attributeName")=="stroke"){
			var newValue;
			var color = new RGBColor(Rep.getAttribute("from"));
			if(color.ok){
				newValue = 'rgb('+parseInt(color.r,10)+','+parseInt(color.g,10)+','+parseInt(color.b,10)+')';
				Rep.setAttributeNS(null, "from", newValue);
			}
		}
		var F=Rep.getAttribute("from").replace(/^\s+|\s+$/g,"").match(/[^\d-\.]+|-?\d*\.?\d+/g);
		var T=Rep.getAttribute("to").replace(/^\s+|\s+$/g,"").match(/[^\d-\.]+|-?\d*\.?\d+/g);
	}
	else return false;
	for(var i=0; i<F.length; i++){
		if(isNaN(parseFloat(F[i]))) value.push(F[i]);
		else if(F.join("").indexOf("rgb")>-1) value.push(Math.max(parseInt(numValue(F[i], T[i], t)), 0));
		else value.push(parseFloat(numValue(F[i], T[i], t)));
	}
	return value.join("");
}
 
function numValue(from, to, t){
	to=parseFloat(to);
	from=parseFloat(from);
	var value=from+(to-from)*t;
	if(value.toString().indexOf("e")>-1) value=0;
	return value;
}

function loadFile(FileName, FileType){
	if(FileType=="js") {	
		// load external JavaScript file
    var s = document.createElementNS(xhtmlNS, "script");
    s.setAttribute("src", FileName);
    root.appendChild(s);
	}
}