xmlns="http://www.w3.org/2000/svg";
xlink="http://www.w3.org/1999/xlink";
svgr="http://granite.sru.edu/svgr";
root=document.documentElement;

function init(evt){
	var ReplicateElements=document.getElementsByTagNameNS(svgr,"replicate");
	for (var i=0;i<ReplicateElements.length;i++){
		replicate(ReplicateElements.item(i), i);
	}
	// replacing the root with a clone works around non-starting animation bug in Opera 10.60
	var newRoot=root.cloneNode(true);
	document.removeChild(root);
	document.appendChild(newRoot);
	root=document.documentElement;
	var animateElements = root.getElementsByTagNameNS("xmlns", "animate");
	for (var i = 0; i < animateElements.length; i++) {
		animateElements.item(i).beginElement();
	}
}
 
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
			if(ReplicateAttributeItem.hasAttribute("keySplines")) t=getKeySplineTime(ReplicateAttributeItem.getAttribute("keySplines").split(/[ *, *]|[ *]/g), t, repeatCount);
			else t=n/repeatCount;
			var value=getValue(ReplicateAttributeItem, t);
			Clone.setAttributeNS(null, ReplicateAttributeItem.getAttributeNS(null,"attributeName"), value);
		}
		for (var i=0;i<ReplicatePathElements.length;i++){
			var ReplicatePathItem=ReplicatePathElements.item(i);
			if(ReplicatePathItem.hasAttribute("keySplines")) t=getKeySplineTime(ReplicatePathItem.getAttribute("keySplines").split(/[ *, *]|[ *]/g), t, repeatCount);
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
			if(ReplicateModifierItem.hasAttribute("keySplines")) t=getKeySplineTime(ReplicateModifierItem.getAttribute("keySplines").split(/[ *, *]|[ *]/g), t, repeatCount);
			else t=n/repeatCount;
			var modifierType=ReplicateModifierItem.getAttributeNS(null,"modifierType");
			if (modifierType=="filter"){
				var filterurl=Original.getAttribute("filter");
				var reference=filterurl.split(/[#)]/g)[1];
				var newId=reference+"-"+k+"-"+n;
				if(document.getElementById(newId)) var newFilter=document.getElementById(newId);
				else{
					var referent=document.getElementById(reference);
					var newFilter=referent.cloneNode("true");
					newFilter.setAttribute("id",newId);
					var ReferentNextSibling;
					if (referent.nextSibling) ReferentNextSibling=referent.nextSibling;
				}
				var value=getValue(ReplicateModifierItem, t);
				newFilter.setAttributeNS(null, ReplicateModifierItem.getAttribute("attributeName"), value);
				Clone.setAttributeNS(null, "filter", "url(#"+newId+")");
				if(ReferentNextSibling) referent.parentNode.insertBefore(newFilter, ReferentNextSibling);
				else referent.parentNode.appendChild(newFilter);
			}
			if (modifierType=="filterPrimitive" || modifierType.substring(0,2)=="fe"){
				var filterurl=Original.getAttribute("filter");
				var reference=filterurl.split(/[#)]/g)[1];
				var newId=reference+"-"+k+"-"+n;
				if(document.getElementById(newId)) var newFilter=document.getElementById(newId);
				else{
					var referent=document.getElementById(reference);
					var newFilter=referent.cloneNode("true");
					newFilter.setAttribute("id",newId);
					var ReferentNextSibling;
					if (referent.nextSibling) ReferentNextSibling=referent.nextSibling;
				}
				var Cnum=ReplicateModifierItem.getAttributeNS(null,"childNum");
				var allChildren=newFilter.getElementsByTagName("*");
				var properChild=allChildren.item(Cnum);
				var value=getValue(ReplicateModifierItem, t);
				properChild.setAttributeNS(null, ReplicateModifierItem.getAttribute("attributeName"), value);
				Clone.setAttributeNS(null, "filter", "url(#"+newId+")");
				if(ReferentNextSibling) referent.parentNode.insertBefore(newFilter, ReferentNextSibling);
				else referent.parentNode.appendChild(newFilter);
			}
			else if (modifierType=="animate"){
				var Cnum=ReplicateModifierItem.getAttributeNS(null,"childNum");
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
				else if (modifierType=="gradientStop"){
				//something like <replicateModifier modifierType="gradientStop"  childNum="2" attributeName="offset"  values=".05; .95; .05" />
					var Cnum=ReplicateModifierItem.getAttributeNS(null,"childNum");
					var allStops=newFill.getElementsByTagName("stop");
					var properStop=allStops.item(Cnum);
					var value=getValue(ReplicateModifierItem, t);
					properStop.setAttributeNS(null, ReplicateModifierItem.getAttribute("attributeName"), value);
					Clone.setAttributeNS(null, "fill", "url(#"+newId+")");
				}
				else if (modifierType=="pattern"){
					var value=getValue(ReplicateModifierItem, t);
					newFill.setAttributeNS(null, ReplicateModifierItem.getAttribute("attributeName"), value);
					Clone.setAttributeNS(null, "fill", "url(#"+newId+")");					
				}
				else if(modifierType=="patternChild"){
					var Cnum=ReplicateModifierItem.getAttributeNS(null,"childNum");
					var allChildren=newFill.getElementsByTagName("*");
					var properChild=allChildren.item(Cnum);
					var value=getValue(ReplicateModifierItem, t);
					properChild.setAttributeNS(null, ReplicateModifierItem.getAttribute("attributeName"), value);
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

function getKeySplineTime(S, t, repeatCount){
		return CubicBezierAtTime(t,S[0],S[1],S[2],S[3],repeatCount)
}

	// 1:1 conversion to js from webkit source files
	// UnitBezier.h, WebCore_animation_AnimationBase.cpp
	function CubicBezierAtTime(t,p1x,p1y,p2x,p2y,duration) {
		var ax=0,bx=0,cx=0,ay=0,by=0,cy=0;
		// `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
        function sampleCurveX(t) {return ((ax*t+bx)*t+cx)*t;};
        function sampleCurveY(t) {return ((ay*t+by)*t+cy)*t;};
        function sampleCurveDerivativeX(t) {return (3.0*ax*t+2.0*bx)*t+cx;};
		// The epsilon value to pass given that the animation is going to run over |dur| seconds. The longer the
		// animation, the more precision is needed in the timing function result to avoid ugly discontinuities.
		function solveEpsilon(duration) {return 1.0/(200.0*duration);};
        function solve(x,epsilon) {return sampleCurveY(solveCurveX(x,epsilon));};
		// Given an x value, find a parametric value it came from.
        function solveCurveX(x,epsilon) {var t0,t1,t2,x2,d2,i;
			function fabs(n) {if(n>=0) {return n;}else {return 0-n;}}; 
            // First try a few iterations of Newton's method -- normally very fast.
            for(t2=x, i=0; i<8; i++) {x2=sampleCurveX(t2)-x; if(fabs(x2)<epsilon) {return t2;} d2=sampleCurveDerivativeX(t2); if(fabs(d2)<1e-6) {break;} t2=t2-x2/d2;}
            // Fall back to the bisection method for reliability.
            t0=0.0; t1=1.0; t2=x; if(t2<t0) {return t0;} if(t2>t1) {return t1;}
            while(t0<t1) {x2=sampleCurveX(t2); if(fabs(x2-x)<epsilon) {return t2;} if(x>x2) {t0=t2;}else {t1=t2;} t2=(t1-t0)*.5+t0;}
            return t2; // Failure.
        };
		// Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
		cx=3.0*p1x; bx=3.0*(p2x-p1x)-cx; ax=1.0-cx-bx; cy=3.0*p1y; by=3.0*(p2y-p1y)-cy; ay=1.0-cy-by;
		// Convert from input time to parametric value in curve, then from that to output time.
    	return solve(t, solveEpsilon(duration));
	}

function getValue(Rep,t){
	var value=new Array();
	if (Rep.hasAttribute("values")){
		if (Rep.hasAttribute("keyTimes")){}
		var V=Rep.getAttribute("values").split(/ *; */g);
		var valueprop=(V.length-1)*t;
		//var firstindex=(Math.floor(valueprop)<V.length-1)? Math.floor(valueprop) : V.length-2;
		firstindex = Math.floor(valueprop)
		var F=V[firstindex].match(/[^\d-]+|-?\d+\.?\d*/g);
		var T=V[firstindex+1].match(/[^\d-]+|-?\d+\.?\d*/g);
		var t=valueprop-firstindex;
	}
	else if (Rep.hasAttribute("from")){
		var F=Rep.getAttribute("from").match(/[^\d-]+|-?\d+\.?\d*/g);
		var T=Rep.getAttribute("to").match(/[^\d-]+|-?\d+\.?\d*/g);
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