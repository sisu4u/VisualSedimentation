// ....................................................................
// Main Visual Sedimentation Code
// ....................................................................

// TODO :
// - callback on rollOut

(function($){

// Name Space Plug in Jquery Objects
$.fn.vs = function (){}
$.fn._vs={}

// All this objects are define in correspondant .js files
$.fn._vs.token      = {}
$.fn._vs.draw       = {}
$.fn._vs.stream     = {}
$.fn._vs.chart      = {}
$.fn._vs.phy        = {}
$.fn._vs.decay      = {}
$.fn._vs.flocculate = {}
$.fn._vs.strata     = {}
$.fn._vs.aggregate  = {}


// Core Classe
var VisualSedimentation = function(element,options){

  // Attach objects
  this.token        = $.fn._vs.token
  this.draw         = $.fn._vs.draw
  this.stream       = $.fn._vs.stream
  this.chart        = $.fn._vs.chart
  this.phy          = $.fn._vs.phy
  this.decay        = $.fn._vs.decay
  this.flocculate   = $.fn._vs.flocculate
  this.strata       = $.fn._vs.strata
//  this.aggregate    = $.fn._vs.aggregate
  this.requestAnimFrame;


  // Mouse object have to be refactor
  this.mouse        ={}
  this.mouse.x      = 0
  this.mouse.y      = 0
  this.mouse.isMouseDragging = false
  this.mouse.isMouseDown     = false
  this.mouse.selectedBody    = null


  // Variables
  this.dataFlow     = [];
  this.chartPhySetup= {}
  this.tokens       = [];
  this.world        = null;
  this.ctx          = null;
  var elem 	        = $(element);
  var self 	        = this;
	var tokens        = [];
	var B2D;
	var canvas;


   // Default Settings
	var defaultSettings = {
          x:0,
          y:0,
          width:290.5,
          height:300.5,
          DOMelement:null,

          chart:{
              x:undefined,
              y:undefined,
              width:undefined,
              height:undefined,
              colorRange:d3.scale.category10(),
              scale:d3.scale,
              type:'StackedAreaChart',
                  /*
                    name are based on prefuse tollokit layout :
                     - CircleLayout,
                     - StackedAreaChart,
                     //- bubbleAreaChart,
                     x AxisLabelLayout,
                     x AxisLayout,
                     x CollapsedStackLayout,
                     x GridLayout,
                  */
              spacer:5,
              //treeLayout:false,
              column:3,
              wallColor:"rgba(230,230,230,0)",
              label:true,
              radius:10 // for CircleLayout
          },
          data:{
              model:[
                        {label:"Column A"},
                        {label:"Column B"},
                        {label:"Column C"},
                      ],
              strata:[
                      [
                        {initValue: 100, label: "Strata 1 col A"}
                      ],[
                        {initValue: 20, label: "Strata 1 col B"}
                      ],[
                        {initValue: 175, label: "Strata 2 col C"}
                      ]
                      ],
              token:[
                       {
                         timestamp:1,
                         category:1,
                         value: 1,
                         userdata:{},
                         callback:{}
                       }
                      ],
              tokenPast:0,
          		stream:{
                      provider:'generator',
          				    refresh:10000/8,
                      now:0
      					},
          		}
          ,
          sedimentation:{
              token:{size:{original:4
                          ,minimum:2}
                          ,visible:true},   // fill color, shape,
              incoming:{
                        strategy:1,         // 1 = one element by one, more = by Groupe
                        point:[{x:50,y:0},
                              {x:100,y:0},
                              {x:150,y:0}],

                        target:[{x:50,y:0},
                              {x:100,y:0},
                              {x:150,y:0}]
                        },
              granulate:{visible:false},
              flocculate:{
            			 number:1,	       // 1 = one element by one, more = by groupe of n
            			 action:"buffer",       	// [buffer,continue]
            			 strategy:"Size",       	// [BufferSize, Time, AcummulationAreaHeight, Fps, Manual]
                   bufferSize:5,         	  // number of token to make floculation
            			 bufferTime:1000,      	  // time buffer to make flocullation
            			 bufferHeight:50,       	// height (pixel) to make floculation
            			 bufferFrameRate:25,    	// if the computer is to slow floculate
                   buffer:[]
    					},
              suspension:{
                          height:null,      // pourcent,adaptative
                          incomming:'top',
                          decay:{power:1.001}, // null
                          refresh:200
                         },
              accumulation:{height:null},   // pourcent ,adaptative
              aggregation:{height:0, maxData:0, invertStrata:false},       // pourcent ,adaptative
          },
          options:{
                  refresh:1000/25,
                  panel:false,
                  scale:30,
                  layout:false,
                  canvasFirst:true
                  }
          }


    this.now = function(){
      return(new Date().getTime())
    }

     // get Box2d World
     this.globalDecay = function (value){
      if(typeof(value)=='undefined'){
        return this.settings.sedimentation.suspension.decay.power
      }else{
        return this.settings.sedimentation.suspension.decay.power=value
      }
     }

     // get Box2d World
     this.getWorld = function (){
      return this.world;
     }

     this.chartUpdate = function (cat,y){
      var options = {cat:cat,y:y}
      this.chart[this.settings.chart.type](self,'update',options)
     }

     // Todo  ......
     this.flocculateTokens = function (number){
      return this.flocculate.update(self,number)
     }

     // TODO DESTROY ALL TOKENS
    this.flocculateAll = function(){
        return this.flocculate.all(self)
     }

     // Add token function
     this.addToken = function (element){
      //var token = this.token.addToken(self,element)
      return this.token.addToken(self,element);
     }

     // Select token fonction
     this.selectAll = function (key,value){
      return this.token.selectAll(self,key,value);
     }

     // Select token fonction
     this.select = function (key,value){
      return this.token.select(self,key,value);
     }

     // update a categoryr in the chart
     this.updateAll = function (values){
      var tokens = this.chart.updateAll(self,key,value)
      return tokens;
     }

     // update a category in the chart
     this.update = function (key,value){
      var tokens = this.chart.update(self,key,value)
      return tokens;
     }


    /// Settings without


    //////////////////////////////////////////////////////// TO CLEAN
    // SAM @ROM1 : are you sure you need that ? extend doing it well normally
  	// Merge options with defaults
    // http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically

    //console.log("////////")
    //options.model = modelToStrata(options.data.model)

    function merge_options(obj1,obj2){
        var obj3 = {};
        for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
        for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
        return obj3;
    }

     merge_options(defaultSettings, options);
     if(options.data!=undefined)
     defaultSettings.data = options.data;

     ////////////////////////////////////////////////////////////////////////////////////
     // Merge option and add the DOMelement to setting
     //this.settings = $.extend(defaultSettings, options || {});
     this.settings = $.extend(true,defaultSettings, options);
     this.settings.DOMelement = element
     //console.log('settings after extend',this.settings)

     // -----------------------------------------------
     // SIMPLE DEFAULT SETTING FOR RETRO COMPATIBILITY
     //
     if(typeof(this.settings.chart.width) =="undefined"){this.settings.chart.width = this.settings.width}
     if(typeof(this.settings.chart.x)     =="undefined")this.settings.chart.x=0
     if(typeof(this.settings.chart.y)     =="undefined")this.settings.chart.y=0
     if(typeof(this.settings.chart.height)=="undefined")this.settings.chart.height=this.settings.height
     if(typeof(this.settings.stream)      =="undefined"){this.settings.stream={}}
     if(typeof(this.settings.stream.now)  =="undefined"){this.settings.stream.now=0}
     if(typeof(this.settings.stream.provider)=="undefined"){this.settings.stream.provider='generator'}
     if(typeof(this.settings.stream.refresh)=="undefined"){this.settings.stream.refresh=1000}
     if(typeof(this.settings.data.tokenPast)=="undefined"){this.settings.data.tokenPast=0}
     if(typeof(this.settings.data.tokens)=="undefined"){this.settings.data.tokens=[]}

     // FOR ROM1 setting by default aggregation :
     if(typeof(this.settings.data.strata) !="undefined" && this.settings.data.strata.length!=0){
       if(typeof(this.settings.sedimentation.aggregation) =="undefined"){
          this.settings.sedimentation.aggregation = {}
        }
       if(typeof(this.settings.sedimentation.aggregation.height) =="undefined"){
          this.settings.sedimentation.aggregation.height = this.settings.chart.height/2
       }
      if(typeof(this.settings.sedimentation.aggregation.maxData) =="undefined"){
          this.settings.sedimentation.aggregation.maxData = 10
       }
     }
     // END


     // Initialisation - Private method
     this.init = function(){
       // requestAnim shim layer by Paul Irish
       // not use yet, to add
       this.requestAnimFrame = (function(){
         return  window.requestAnimationFrame       ||
                 window.webkitRequestAnimationFrame ||
                 window.mozRequestAnimationFrame    ||
                 window.oRequestAnimationFrame      ||
                 window.msRequestAnimationFrame     ||
                 function(/* function */ callback, /* DOMElement */ element){
                   window.setTimeout(callback, 1000 / 60);
                 };
       })();

        //console.log(this.settings)
        //console.log('Initialisation');

        // Create the physical simulation
   		   this.world = new this.phy.b2World(
   		      new this.phy.b2Vec2(0, 0)       //gravity
   		     ,  true                 //allow sleep
   		   );

   	    // Create container and canvas for physical simulation drawing
		    var container = element.appendChild(document.createElement("div"));
		    container.id  = "box_sediviz_"+GUID()
        container.width  = this.settings.width; // TOFIX
        container.height = this.settings.height;

        //console.log(container.id)
        // Allocate the new Element
        this.settings.DOMelement = container

		    canvas 		    = container.appendChild(document.createElement("canvas"));
		    canvas.id 	  = "canvas";
		    canvas.width  = this.settings.width; // TOFIX
		    canvas.height = this.settings.height;
        canvas.style.position = "absolute"

        //console.log(this.settings.width,this.settings.height)
        this.ctx = canvas.getContext("2d");

       // Construct the Chart
       this.chart[this.settings.chart.type](self,'init')


       // Draw d3
       //if(typeof(this.settings.options.debugaggregate)=="undefined"){
       // this.aggregate.init(self);
       //}
       // Initiatlise stream
       this.stream.init(self)
       // Initiatlise decay
       this.flocculate.init(self)
       // Update stream
       this.stream.update(self);

       // Initiatlise tokens
       this.token.init(self)

       //FORCE UPDATE CHART due to  (bug positionnement ) @rom1
      this.strata.init(this)

   		 // Update the physical simulation
  		 window.setInterval(
              function(){self.update(self);},
               self.settings.options.refresh/2
              );
       // Refresh canvas drawings
       window.setInterval(
              function(){self.draw.update(self);},
              self.settings.options.refresh
              );
       // Update Decay
       window.setInterval(
              function(){self.decay.update(self);},
              self.settings.sedimentation.suspension.refresh
       );
       //this.decay.update(self);

      self.strata.update(self)


 // MOUSE PART
 // inspired by box2d stuffs, have to clean and finish this !
 // http://www.emanueleferonato.com/2008/11/20/dragging-objects-with-box2d-flash/
 // --------------------------
   this.getBodyAtMouse=function (_this) {

      var x         = _this.mouse.x/_this.settings.options.scale
      var y         =_this.mouse.y/_this.settings.options.scale
      var mousePVec = new _this.phy.b2Vec2(x,y);
      var aabb      = new _this.phy.b2AABB();
      var area      = 0.001

      //console.log(_this.mouse.x,_this.mouse.y)
      aabb.lowerBound.Set(x - area, y - area);
      aabb.upperBound.Set(x + area, y + area);

      // Query the world for overlapping shapes.
      _this.mouse.selectedToken = null;

      // MERCI JULIEN POUR LE CLOSURE
      //selectedBody
      _this.world.QueryAABB(function(fixture){
        return getBodyCB(fixture,_this,mousePVec)
      }, aabb);

      return _this.mouse.selectedToken;
   }
   //http://stackoverflow.com/questions/11674200/how-to-send-prototype-method-as-a-callback-in-javascript
   // pb here
   function getBodyCB(fixture,_this,mousePVec) {
       //console.log("phy",phy)
      //console.log("fixture",fixture.m_userData.type,fixture)
      //_this.mouse.elementpoi = fixture.GetBody()
      _this.mouse.selectedToken = fixture;

      if(fixture.GetBody().GetType() != _this.phy.b2Body.b2_staticBody) {
         if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
            _this.mouse.selectedToken = fixture;
            return false;
         }
      }
      return true;
   }

    this.handleMouseMove = function(e,_this) {
       canvasPosition   = DOMabsOffset(_this.settings.DOMelement)
       _this.mouse.x = (e.clientX - (canvasPosition.offsetLeft- this.getScrollPosition()[0]));
       _this.mouse.y = (e.clientY - (canvasPosition.offsetTop- this.getScrollPosition()[1]));
      //if( _this.mouse.isMouseDown){  console.log(_this.mouse.y,canvasPosition.y)}
      //console.log("mouse",e.clientX,e.clientY )
      //console.log("mouse",canvasPosition.x,canvasPosition.y )
      //console.log("=",_this.mouse.x,_this.mouse.y)
   };
   // from
   this.getScrollPosition= function(){
    return Array((document.documentElement && document.documentElement.scrollLeft) || window.pageXOffset || self.pageXOffset || document.body.scrollLeft,(document.documentElement && document.documentElement.scrollTop) || window.pageYOffset || self.pageYOffset || document.body.scrollTop);
    }

   document.addEventListener("mousemove",   function (e){onDocumentMouseMove(e,self)});
   document.addEventListener("mouseup",   function (e){onDocumentMouseUp(e,self)});
   document.addEventListener("mousedown", function (e){onDocumentMouseDown(e,self)});



   function onDocumentMouseOver(e,_this) {

     var s = _this.getBodyAtMouse(_this);
        if(s!=null){
          if(typeof(s.m_userData)!="undefined"){
           if(typeof(s.m_userData.callback)!="undefined"){
            if(typeof(s.m_userData.callback.mouseover)=="function"){
                var t = _this.select('ID',s.m_userData.ID)
                s.m_userData.callback.mouseover(t)
            }

            if(typeof(s.m_userData.callback.mouseout)=="function"){
                //console.log("mouseout exist")
                var t = _this.select('ID',s.m_userData.ID)
                var mouseoutTrigger
                var rollOut = function(){
                      var mt  = mouseoutTrigger
                      var tt  = t
                      var ici = _this
                      var ss  = s
                      return function(){
                           var s = ici.getBodyAtMouse(ici);
                           var mo = false;
                           if(s!=null){
                              if(typeof(s.m_userData)!="undefined"){
                                  if(s.m_userData.ID==tt.attr('ID')){
                                      mo=false
                                  }else{
                                    mo=true
                                  }
                              }else{
                                mo=true
                              }
                           }else{
                            mo=true;
                           }
                           if(mo){
                            ss.m_userData.callback.mouseout(tt)
                            clearInterval(mouseoutTrigger)
                           }
                      }
                };
                mouseoutTrigger = window.setInterval(rollOut(),100)
            }
           }
          }
        }
   }

   function onDocumentMouseDown(e,_this) {
     //console.log("onDocumentMouseDown")
     _this.mouse.isMouseDown = true;
     // return false;
     _this.handleMouseMove(e,_this);
     var s = _this.getBodyAtMouse(_this);
    if(s!=null){
      if(typeof(s.m_userData)!="undefined"){
        if(typeof(s.m_userData.callback)!="undefined"){
          if(typeof(s.m_userData.callback.onclick)=="function"){
               var t = _this.select('ID',s.m_userData.ID)
              s.m_userData.callback.onclick(t)
         }
        }
      }
     }
   }

      function onDocumentMouseUp(e,_this) {
        _this.mouse.isMouseDown = false;
       // isMouseDown = false;
       // return false;
       //console.log("onDocumentMouseUp")
      }
      function onDocumentMouseMove( e,_this ) {

       if(_this.mouse.isMouseDown){
           _this.mouse.isMouseDragging = true;
           _this.mouse.x = e.clientX;
           _this.mouse.y = e.clientY;

      }else{
          _this.handleMouseMove(e,_this);
          onDocumentMouseOver("move",_this)
      }
      //console.log("m",_this)
      }
  }


  this.mouse.update = function (s) {
      if(isMouseDown && (!mouseJoint)) {
         var body = getBodyAtMouse();
         if(body) {
            var md = new b2MouseJointDef();
            md.bodyA = world.GetGroundBody();
            md.bodyB = body;
            md.target.Set(mouseX, mouseY);
            md.collideConnected = true;
            md.maxForce = 300.0 * body.GetMass();
            mouseJoint = world.CreateJoint(md);
            body.SetAwake(true);
         }
      }

      if(mouseJoint) {
         if(isMouseDown) {
            mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
         } else {
            world.DestroyJoint(mouseJoint);
            mouseJoint = null;
         }
      }

   };



 // MOUSE END
 // --------------------------

    this.update = function (s) {
     	this.world.Step(1 / 60, 10, 10);
     	this.world.DrawDebugData();
     	this.world.ClearForces();
      //console.log('u')
     }

    var drawInit = function(){
      ctx.fillStyle = "rgb(200,0,0)";
 		  this.ctx.font = "14pt Calibri,Geneva,Arial";
      this.ctx.fillText("Canvas ready for Visual Sedimentation ", 10, 20);
		  window.setInterval(
			   $.fn.vs.draw.refresh(ctx,world,this.settings)
			   , this.settings.options.refresh);
		 console.log("draw Init ")
     }


     var DOMabsOffset = function(target){
        var top = target.offsetTop;
        var left = target.offsetLeft;

        while(target = target.offsetParent) {
          top += target.offsetTop;
          left += target.offsetLeft;
        }

        return {offsetLeft:left, offsetTop:top};
      };

    // GUID generator from :
    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    var GUID = function(){
        var S4 = function ()
        {
            return Math.floor(
                    Math.random() * 0x10000 /* 65536 */
                ).toString(16);
        };

        return (
                S4() + S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + S4() + S4()
            );
    }

    // clone object
    // http://stackoverflow.com/questions/728360/copying-an-object-in-javascript
    function clone(obj) {
      if (null == obj || "object" != typeof obj) return obj;
      var copy = obj.constructor();
      for (var attr in obj) {
          if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
      }
      return copy;
    }
    this.utile       = {}
    this.utile.GUID  = GUID
    this.utile.clone = clone

    this.settings = $.extend(this.settings, {} || {});
    //console.log("ici",this.settings)
    this.init();

 };

$.fn.vs  = function(options){
  if (!arguments.length){var options={}}
  //console.log('$.fn.vs settings',options)
     return this.each(function(){
         var element = $(this);
         // Return early if this element already has a plugin instance
         if (element.data('VisualSedimentation')) return;
         var visualSedimentation = new VisualSedimentation(this,options);
         // Store plugin object in this element's data
         element.data('visualSedimentation', visualSedimentation);
         //visualSedimentation.test();
     });
 };

})(jQuery);






(function ($) {

$.fn._vs.phy = {
  b2Vec2             : Box2D.Common.Math.b2Vec2,
  b2AABB             : Box2D.Collision.b2AABB,
  b2BodyDef          : Box2D.Dynamics.b2BodyDef,
  b2Body             : Box2D.Dynamics.b2Body,
  b2FixtureDef       : Box2D.Dynamics.b2FixtureDef,
  b2Fixture          : Box2D.Dynamics.b2Fixture,
  b2World            : Box2D.Dynamics.b2World,
  b2MassData         : Box2D.Collision.Shapes.b2MassData,
  b2PolygonShape     : Box2D.Collision.Shapes.b2PolygonShape,
  b2CircleShape      : Box2D.Collision.Shapes.b2CircleShape,
  b2DebugDraw        : Box2D.Dynamics.b2DebugDraw,
  b2MouseJointDef    : Box2D.Dynamics.Joints.b2MouseJointDef,
  b2Shape            : Box2D.Collision.Shapes.b2Shape,
  b2DistanceJointDef : Box2D.Dynamics.Joints.b2DistanceJointDef,
  b2RevoluteJointDef : Box2D.Dynamics.Joints.b2RevoluteJointDef,
  b2Joint            : Box2D.Dynamics.Joints.b2Joint,
  b2PrismaticJointDef: Box2D.Dynamics.Joints.b2PrismaticJointDef,
  b2ContactListener  : Box2D.Dynamics.b2ContactListener,
  b2Settings         : Box2D.Common.b2Settings
}

})(jQuery);

(function ($) {
$.fn.vs.chart = {
	/*
		actually empty everything is in
	   _vs.AxisLabelLayout.js,
       _vs.AxisLayout.js,
       _vs.CircleLayout.js,
       _vs.CollapsedStackLayout.js,
       _vs.GridLayout.js,
       _vs.StackedAreaChart.js


  this.update = function(_this,options){
    var defaultOptions = {cat:0,y:0}
    if(_this.chartPhySetup.grounds[options.cat]!=null) {
      var myBody = _this.chartPhySetup.grounds[options.cat].GetBody();
      var myPos = myBody.GetWorldCenter();
      myPos.y-=options.y/ _this.settings.options.scale;
      myBody.SetPosition(myPos);
      //console.log(myBody)
    }
  }

  this.getPosition = function(_this){
    var result =[]
    for (var i = 0; i < _this.chartPhySetup.grounds.length; i++) {
      myBody = _this.chartPhySetup.grounds[i].GetBody();

      console.log(myBody.GetWorldCenter())

      result.push({
        x:(myBody.GetWorldCenter().x* _this.settings.options.scale),
        y:(myBody.GetWorldCenter().y* _this.settings.options.scale),
        a:myBody.GetAngle()
      })

    };
   return result
  }
 */
}


})(jQuery);

(function ($) {

$.fn._vs.draw = {

    settings:{
              draw:{
                trail:1,
                showLayout:false
              }
    },

    update:function(_this){
      /* refresh rate of canvas (show trail) */
      //console.log(_this.ctx)
      if(this.settings.draw.trail==1) {
        _this.ctx.clearRect(0, 0, _this.ctx.canvas.clientWidth, _this.ctx.canvas.clientHeight);
      }else{
        debugDrawChart(0,
            0,
            ctx.canvas.clientWidth,
            ctx.canvas.clientHeight,
            "rgba(255,255,255,"+this.settings.draw.trail+")",
            ctx);
      }

      /* Draw body(s) from box2d */
      for( var b = _this.world.GetBodyList() ; b ; b = b.GetNext()) {
        for (var s = b.GetFixtureList(); s != null; s = s.GetNext()) {
          this.drawShape(_this,s);
        }
      }

      /* Show wireframe mode */
      if(this.settings.draw.showLayout==true){
        this.debugDrawChart(chart.position.x,
                chart.position.y,
                chart.position.width,
                chart.position.height,
                "rgba(255,0,0,0.2)",
                ctx);
      }
    },
    debugDrawChart :function (x,y,w,h,color,ctx) {
      ctx.save();
      ctx.translate(0,0);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.rect(x,y,w,h);
      ctx.closePath();
      ctx.strokeStyle ="#000"
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    },
    showTexture:function( s, ctx ){
      if (typeof(s.m_userData.texture) !== "undefined" && typeof(s.m_userData.texture.pattern) !== "undefined") {
          ctx.fillStyle = s.m_userData.texture.pattern;
          ctx.fill();
      }
    },

    drawShape: function (_this,s) {
    var b           = s.GetBody();
    var position    = b.GetPosition();
    var angle       = b.GetAngle();
    var radiusCoef  = 9;
    var radiusCoefMax=10
    var scale       = _this.settings.options.scale

    // add x and y to userData
    s.m_userData.x  = b.GetWorldCenter().x*scale
    s.m_userData.y  = b.GetWorldCenter().y*scale



    if(typeof(s)!="undefined"){
    switch (s.GetType()){
      case 0:  // round

        switch (s.m_userData){
          case null:
            _this.ctx.fillStyle = "rgba(255,0,0,1)";
          break;
          default:
            _this.ctx.fillStyle = s.m_userData.fillStyle;
          break
        }

        var radius = s.m_shape.m_radius

        // round token
        if(_this.settings.sedimentation.token.visible==true){

          _this.ctx.save();
          _this.ctx.translate(position.x*scale, position.y*scale);
          _this.ctx.rotate(angle);
          _this.ctx.beginPath();
          var h = (radius/radiusCoefMax*radiusCoef)*scale

          //console.log(s.m_userData.strokeStyle)
          if(typeof(s.m_userData.strokeStyle)!="undefined"){
            _this.ctx.strokeStyle = s.m_userData.strokeStyle
          } else{
            _this.ctx.strokeStyle = "rgba(0,0,0,0)"
          }

          if(typeof(s.m_userData.lineWidth)!="undefined"){
            _this.ctx.lineWidth   = s.m_userData.lineWidth
          } else {
            _this.ctx.lineWidth = 0
          }

          _this.ctx.arc(0, 0,h, 0, Math.PI*2, true);

          _this.ctx.closePath();

          if(_this.settings.options.layout==true){
            _this.ctx.strokeStyle = "#000"
            _this.ctx.lineWidth   = 0.5
            _this.ctx.stroke();
          }else{
             _this.ctx.fill();
             _this.ctx.stroke();
             this.showTexture(s, _this.ctx);

          }

          _this.ctx.restore();

        }


      break
      case 1: // vertice (polygon and squares ...)

        //if(s.m_userData.type != "wall" && s.m_userData.type != "lift")console.log("draw",s.m_userData)

        switch (s.m_userData){
          case null:
            _this.ctx.fillStyle = "rgba(255,0,0,1)";
          break;
          default:
            _this.ctx.fillStyle = s.m_userData.fillStyle;
          break
        }

        var width = s.m_shape.m_vertices[0].x*scale
        var height = s.m_shape.m_vertices[0].y*scale
        var posx = position.x*scale-s.m_shape.m_vertices[0].x*scale
        var posy = position.y*scale-s.m_shape.m_vertices[0].y*scale

        _this.ctx.save();
        _this.ctx.translate(position.x*scale, position.y*scale);
        _this.ctx.rotate(angle);
        _this.ctx.beginPath();

        //if(s.m_userData.ID==1 ){ console.log(s.m_userData.lineWidth) }
        //if(typeof(s.m_userData.fillStyle)!="undefined")   _this.ctx.fillStyle   = s.m_userData.fillStyle
        if(typeof(s.m_userData.strokeStyle)!="undefined"){ _this.ctx.strokeStyle = s.m_userData.strokeStyle
        } else{   _this.ctx.strokeStyle = s.m_userData.fillStyle}

        if(typeof(s.m_userData.lineWidth)!="undefined"){  _this.ctx.lineWidth   = s.m_userData.lineWidth
        } else{   _this.ctx.lineWidth = 0}

        for (var i = 0; i < s.m_shape.m_vertices.length; i++) {
          var points = s.m_shape.m_vertices;
          //var this = {x:0,y:0}
          _this.ctx.moveTo(( points[0].x) * scale, (points[0].y) * scale);
          for (var j = 1; j < points.length; j++) {
             _this.ctx.lineTo((points[j].x ) * scale, (points[j].y ) * scale);
          }
          _this.ctx.lineTo(( points[0].x) * scale, ( points[0].y) * scale);
        }
        _this.ctx.closePath();


        _this.ctx.fill();

        this.showTexture(s, _this.ctx);

        // pour le debug mode
        if(_this.settings.options.layout==true){
          _this.ctx.lineWidth   = .25;
          _this.ctx.strokeStyle ="rgb(0,0,0)"
          _this.ctx.stroke();

          // incomming points Drawer
          //for (var i = _this.settings.sedimentation.incoming.point.length - 1; i >= 0; i--) {
            //
            //_this.settings.sedimentation.incoming.point[i].y
            // draw green
            //_this.ctx.font = '40px Arial';
            //_this.ctx.fillText("x", _this.settings.sedimentation.incoming.point[i].x, _this.settings.sedimentation.incoming.point[i].y);
            //_this.ctx.fillStyle = "rgb(0,250,0,0.5)";

          //};

        }else{
          _this.ctx.stroke();
        }
        _this.ctx.restore();

      break;
      case 2:

      break;
      _this.ctx.fillStyle = "rgb(0,0,0)";
    }
   }

    // Call back draw
    if(typeof(s.m_userData.callback)!="undefined"){
        if(typeof(s.m_userData.callback.draw)=="function"){
               var t = _this.select('ID',s.m_userData.ID)
               s.m_userData.callback.draw(t)
        }
    }

    //if(s.m_userData.fillStyle=="black"){
    //  console.log(s.m_userData.cycle,"",s)
    //}
  }
}

})(jQuery);

(function ($) {
$.fn._vs.token = {

    // alias for d3 color scale D3
    colorRange:function(){},

    init:function(_this){
      // Color scale import form d3
      // todo shape management
      this.colorRange = _this.settings.chart.colorRange
    },
    ID:function(_this){
      _this.settings.data.tokenPast+=1
      return _this.settings.data.tokenPast
    },
    selectAll:function(_this,key,value){
      // DRAFT VERSION writing select All ......
      var result = []
      var all    = false
      result.flocculate  = function(){
        var r=[]
        result.forEach(function(i){
          q = i.flocculate()
          r.push(q)
        })
        return r
      }
      result.attr  = function(key,value,param){
        var r=[]
        result.forEach(function(i){
          //console.log(key,value,param)
          q = i.attr(key,value,param)
          //console.log("q",q)
          r.push(q)
        })
        return r
      }

      result.b2dObj  = function(key,value,param){
        var r=[]
        result.forEach(function(i){
          //console.log(key,value,param)
          q = i.myobj
          //console.log("q",q)
          r.push(q)
        })
        return r
      }

      if(typeof(value) == "undefined" && typeof(key) == "undefined"){
        all =true
      }

      for (var i = _this.tokens.length - 1; i >= 0; i--) {
        if(_this.tokens[i].attr(key) == value || all==true){
          result.push(_this.tokens[i])
       }
      }
        return result;
    },

    select:function(_this,key,value){
      result = []
      if(typeof(value) == "undefined" && typeof(key) == "undefined"){
        return _this.tokens
      }else{
        for (var i = _this.tokens.length - 1; i >= 0; i--) {
          if(_this.tokens[i].attr(key) == value){
            result.push(_this.tokens[i])
            break;
          }
        }
      }
      if(typeof(result[0])=="undefined"){
        return false
      }else{
        return result[0];
      }
    },


    addToken:function (_this,element){
     //default token setting
     var defaultTokenSetting ={
        x:50,y:50, // positions
        t:null,    // time
        category:1,// data category
        state:0,   // state
        /*
         0 = Not Enter in the stage,
         1 = suspension,
         2 = floculation,
         2 + n = _this.strata.list[n]
        */

        // Graphic Parameter
        size:10,   fillStyle:'###',  strokeStyle:'rgba(0,0,0,0)', lineWidth:0, texture:undefined,
        shape:{type:'round'}, // vertice, box, round, ?? svg path with json serialisation {}
        userdata:{},

        // Interactions callbacks
        callback:{},

        // Physical parameters
        phy:{ density:10,friction:0,restitution:0},
        targets:[/*{x:null,y:null}*/],
        elbow:{/*x:null,y:null*/}
     }

     var result = null;
     var myobj = null
     var token = {}

     token.toString = function() {
         return "Token ID="+this.setting.ID;
     }

     //console.log(element)
     if(typeof(element)=='undefined'){
        token.setting = defaultTokenSetting
        token.setting.ID = this.ID(_this)
     } else {
        token.setting   = element
        if(typeof(token.setting.phy)    =='undefined') {token.setting.phy    = defaultTokenSetting.phy}
        if(typeof(token.setting.t)      =='undefined') {token.setting.t      = _this.settings.stream.now}
        if(typeof(token.setting.x)      =='undefined') {token.setting.x      = _this.settings.sedimentation.incoming.point[element.category].x+(Math.random()*2)}
        if(typeof(token.setting.y)      =='undefined') {token.setting.y      = _this.settings.sedimentation.incoming.point[element.category].y+(Math.random()*2)}
        if(typeof(token.setting.size)   =='undefined') {token.setting.size   = _this.settings.sedimentation.token.size.original}
        if(typeof(token.setting.targets)=='undefined') {token.setting.targets=[]}
        token.setting.ID = token.setting.ID = this.ID(_this)
        if(typeof(token.setting.state)  =='undefined') {token.setting.state  = 0}
        if(typeof(token.setting.shape)  =='undefined') {token.setting.shape  = defaultTokenSetting.shape }
      }

      token.myobj =  this.create(_this,token.setting)
      //console.log("token.myobj",token.myobj)

          token.flocculate = function(){
            _this.tokens.indexOf(this)
            _this.flocculate.destroyIt(_this,this)
           return this
          }

          token.attr = function(key,value,param){
            //console.log("attr",this.myobj)
            if(typeof(value) == "undefined"){
              if(typeof(this[key])!="undefined"){
               return this[key]()
              }else{
               return this.myobj.m_userData[key]
              }
            }else{
             if(typeof(this[key])!="undefined"){
              this[key](value,param)
             }else{
              this.myobj.m_userData[key]=value
            }
           }
           return this
          }

          token.callback = function(value,param){
            if (!arguments.length){return this.myobj.m_userData.callback}
            if (typeof(this.myobj.m_userData.callback[value])=="function"){
              return this.myobj.m_userData.callback[value](param)
            } else {
              return function(param){console.log("callback undefined")}
            }
          }

          token.size = function(value){
            //console.log(this.attr('state'))
            if(this.myobj!=null && this.attr('state')<2){
              if (!arguments.length){return this.myobj.m_shape.m_radius*this.myobj.m_userData.scale;}
                this.myobj.m_shape.m_radius = value/this.myobj.m_userData.scale
            }
          }
          token.b2dObj = function(){
              if(this.myobj!=null && this.attr('state')<2){
                return this.myobj
              }
          }

          token.texture = function(value){
            if (!arguments.length){return this.myobj.m_userData.texture.img.src;}
             console.log("texture",value);
             var tx = {};
             tx.img = new Image();
             tx.img.onload = function() {
                 tx.pattern = document.createElement('canvas').getContext('2d').createPattern(tx.img, 'repeat');
             }
             tx.img.src = value;
             this.myobj.m_userData.texture = tx;
          }

      //console.log("token",token)
      _this.tokens.push(token)
      _this.decay.tokens.push(token)

      // Execute suspension callback
      if(typeof(this.myobj.m_userData.callback)!="undefined"){
        if(typeof(this.myobj.m_userData.callback.suspension)=="function"){
           var t = _this.select('ID',token.setting.ID)
           this.myobj.m_userData.callback.suspension(t)
        }
      }

     return token
    },

    // CREATE IS A TRY TO UNIFY TOKEN PRODUCTION
    create:function(_this,token) {
      //targetX,targetY, x, y,size,family
      //console.log("create",token)
      token.scale = scale = _this.settings.options.scale

      //console.log("DBT")
      var xPos              = token.x/scale+(Math.random()*0.1);
      var yPos              = token.y/scale+(Math.random()*0.1);

      // CREATE BALL
      var fixDef            = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density      = 0.1;
        fixDef.friction     = 0.0;
        fixDef.restitution  = 0.0;
        //console.log(token)

        // round
        if(token.shape.type == "round"){
          fixDef.shape      = new Box2D.Collision.Shapes.b2CircleShape(token.size/scale);
        // or polygon
        }else if(token.shape.type == "polygons"){
          //fixDef.shape      = new Box2D.Collision.Shapes.b2PolygonShape;
          fixDef            = this.setPolygons(_this,token,fixDef)
        }else if(token.shape.type == "box"){
          fixDef.shape      = new Box2D.Collision.Shapes.b2PolygonShape;
          //console.log(fixDef)
          fixDef.shape.SetAsBox(token.shape.width/scale,token.shape.height/scale)
        }

      var bodyDef           = new Box2D.Dynamics.b2BodyDef;
        bodyDef.type        = Box2D.Dynamics.b2Body.b2_dynamicBody;
        bodyDef.position.x  = token.x/scale;//+(Math.random())
        bodyDef.position.y  = token.y/scale;

      this.myobj = _this.world.CreateBody(bodyDef).CreateFixture(fixDef)

      if(typeof(token.texture)!="undefined"){
        var tx = token.texture;
        tx.img = new Image();
        tx.img.onload = function() {
           tx.pattern = document.createElement('canvas').getContext('2d').createPattern(tx.img, 'repeat');
        }
        tx.img.src = tx.src;
      }

      if(typeof(token.impulse)!="undefined"){
        this.applyImpulse(this.myobj,token.impulse.angle,token.impulse.power);
      }

      if(typeof(token.fillStyle) =="undefined"){   token.fillStyle  = this.colorRange(token.category) }
      //if(typeof(token.stokeStyle)=="undefined"){   token.stokeStyle = "#000"}//"rgba(0,0,0,0.5)" }
      if(typeof(token.lineWidth) =="undefined"){   token.lineWidth  = 0 }
      if(typeof(token.type)  =="undefined"){       token.type="token"   }
      if(typeof(token.callback)  =="undefined"){
        token.callback = {}
                   // {
                   //      suspension:undefined,
                   //      flocculation:undefined,
                   //      draw:undefined,
                   //      mouseover:undefined,
                   //      mouseout:undefined,
                   //      click:undefined
                   //    }
      }

      this.myobj.m_userData       = token
      this.myobj.attr             = this.attr// function (){console.log(this)}
      this.myobj.m_userData.mouse = {}
      this.myobj.m_userData.mouse.over        = false;
      this.myobj.m_userData.mouse.down        = false;
      this.myobj.m_userData.mouse.dragging    = false;
      this.myobj.m_userData.mouse.statebefore = false;
      this.myobj.m_userData.state = 1;  // now in the world

      if(token.targets.length==0 && _this.settings.chart.type=="CircleLayout"){
        token.targets[0]={
                         x: _this.settings.sedimentation.incoming.target[token.category].x,
                         y: _this.settings.sedimentation.incoming.target[token.category].y
                  }
      }

      if(token.targets.length>0){
        //console.log()
        //CREATE JOIN MOUVEMENT TO TARGET
        var md              = new _this.phy.b2MouseJointDef();
        md.bodyA            = _this.world.GetGroundBody();
        md.bodyB            = this.myobj.GetBody();
        md.target.Set(xPos,yPos);
        md.collideConnected = true;
        md.maxForce         = 50 * this.myobj.GetBody().GetMass();
        mouseJoint          = _this.world.CreateJoint(md);
        mouseJoint.SetTarget(new _this.phy.b2Vec2(token.targets[0].x/scale, token.targets[0].y/scale));
      }

      // ADD INFO IN OBJECT
      //categorys[family].value+=1;
      //setTimeout(function(){mouseJoint.SetTarget(chart.position.x/scale, chart.position.y/scale)},1000);
      //categorys[family].joins.push(mouseJoint);

      return this.myobj;
    },

    applyImpulse:function(bodyId, degrees, power) {
    var body = bodyId.GetBody();
    body.ApplyImpulse(new Box2D.Common.Math.b2Vec2(Math.cos(degrees * (Math.PI / 180)) * power,
                                 Math.sin(degrees * (Math.PI / 180)) * power),
                                 body.GetWorldCenter());
    },


    setPolygons:function (_this,token,fixDef){

      fixDef.shape    = new Box2D.Collision.Shapes.b2PolygonShape;

      if(token.shape.points==null){
         token.shape.points = [{x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y:-1},{x: 1, y:-1}]
      };

      for (var i = 0; i < token.shape.points.length; i++) {
          var vec = new Box2D.Common.Math.b2Vec2();
          vec.Set(token.shape.points[i].x/scale, token.shape.points[i].y/scale);
          token.shape.points[i] = vec;
      }

      fixDef.shape.SetAsArray(token.shape.points, token.shape.points.length);
      return fixDef;
    },


    createDataBarBall:function (_this, x, y,size,family) {
      //console.log(Math.round(family)) ;
      var fixDef = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density = 10.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;
        fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape(size/_this.settings.options.scale);

      var bodyDef = new Box2D.Dynamics.b2BodyDef;
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
        bodyDef.position.x = x/_this.settings.options.scale;//+(Math.random())
        bodyDef.position.y = y/_this.settings.options.scale;

      var myobj = _this.world.CreateBody(bodyDef).CreateFixture(fixDef)
      myobj.m_userData={type:"BarChartBall",
                familyID:'family',
                fillColor:this.colorRange(family)} //dynamiq
      //console.log(myobj);
      return myobj;
    },

















    // ....................................................................
    // OLD OLD OLD  Physicals elements
    // !!!!!!!!!!!!!!!!!!   Have to clean
    // ....................................................................

    // !!!!!!!!!! To mix withe the one in piechart and bar chart ::: createBox
    createBox:function (world, x, y, width, height, angle, fillColor, fixed) {
      if (typeof(fixed) == 'undefined') fixed = true;
       var fixDef       = new b2FixtureDef;
      if (!fixed) fixDef.density = 100.0;
       fixDef.friction    = 0.6;
       fixDef.restitution   = 0.3;

       var bodyDef      = new b2BodyDef;
       bodyDef.type     = b2Body.b2_staticBody;
       bodyDef.angle    = angle ;//* b2Settings.b2_pi;
       fixDef.shape     = new b2PolygonShape;
       fixDef.shape.SetAsBox(width/scale, height/scale);
       bodyDef.position.Set(x/scale, y/scale);
       var myobj        = world.CreateBody(bodyDef).CreateFixture(fixDef)
       myobj.m_userData   = {type:"Wall",fillColor:fillColor}
       console.log(myobj.m_userData)
       return myobj;

    },
    createBoxPie:function (world,axis, x, y, width, height, angle, fillColor) {
      var bodyDef     = new b2BodyDef;
        bodyDef.type    = Box2D.Dynamics.b2Body.b2_dynamicBody;
      var fixDef      = new Box2D.Dynamics.b2FixtureDef;
      fixDef.shape    = new b2PolygonShape;
      fixDef.shape.SetAsBox(width/scale, height/scale);
        fixDef.density      = 1000000.0;
        fixDef.friction     = 0.5;
        fixDef.restitution  = 0.2;
        bodyDef.position.Set(x/scale, y/scale);
      bodyDef.angle     = 0;
      var myobj       = world.CreateBody(bodyDef).CreateFixture(fixDef);
      myobj.m_userData  = {type:"Wall",fillColor:fillColor}

       return myobj;

    },
    createBox0D:function (world, x, y, width, height, fixed) {
      if (typeof(fixed) == 'undefined') fixed = true;
      var boxSd = new b2BoxDef();
      boxSd.restitution = -0.6;
      boxSd.friction = .3;
      if (!fixed) boxSd.density = 0.01;
      boxSd.extents.Set(width, height);
      var boxBd = new b2BodyDef();
      boxBd.AddShape(boxSd);
      boxBd.position.Set(x,y);
      return world.CreateBody(boxBd)
    },
    createHiddenBox:function (world, x, y, width, height, fixed) {
      if (typeof(fixed) == 'undefined') fixed = true;
      var boxSd = new b2BoxDef();
      boxSd.restitution = 0.6;
      boxSd.friction = .3;
      if (!fixed) boxSd.density = 1.0;
      boxSd.extents.Set(width, height);
      var boxBd = new b2BodyDef();
      boxBd.AddShape(boxSd);
      boxBd.position.Set(x,y);
      var myObject = world.CreateBody(boxBd)
      myObject.m_shapeList.visibility = 'hidden';
      console.log(myObject);
      return myObject

    },
    createBigBall:function (world, x, y) {
      var fixDef           = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density     = 1000000.0;
        fixDef.friction    = 0.5;
        fixDef.restitution = 0.2;
        fixDef.shape       = new Box2D.Collision.Shapes.b2CircleShape(20/30);

        var bodyDef      = new Box2D.Dynamics.b2BodyDef;
      bodyDef.type     = Box2D.Dynamics.b2Body.b2_dynamicBody;
        bodyDef.position.x = x;
        bodyDef.position.y = y;
      var myobj = world.CreateBody(bodyDef).CreateFixture(fixDef)
      //console.log(myobj)
      return myobj;
    },

    /*
    286
        Create standard boxes of given height , width at x,y
    287
    */

    createPieBox:function (world, x, y, width, height,rotation,color, options){

      //default setting

     options = $.extend(true, {
         'density':10000000.0 ,
         'friction':1.0 ,
         'restitution':0.2 ,
         'linearDamping':0.0 ,
         'angularDamping':0.0 ,
         'gravityScale':0.0 ,
         'type':b2Body.b2_dynamicBody
     }, options);


     var body_def       = new b2BodyDef();
     var fix_def      = new b2FixtureDef;
     fix_def.density    = options.density;
     fix_def.friction     = options.friction;
     fix_def.restitution  = options.restitution;
     fix_def.shape      = new b2PolygonShape();
     fix_def.shape.SetAsBox( width/scale , height/scale );
     body_def.position.Set(x/scale , y/scale);
     body_def.linearDamping = options.linearDamping;
     body_def.angularDamping = options.angularDamping;
     body_def.angle     = rotation;

     body_def.type      = options.type;
     var b          = world.CreateBody( body_def );
     var f          = b.CreateFixture(fix_def);
     f.m_userData     = {type:"box",familyID:null,fillColor:color}

     return b;

    },

    createDataBallTarget:function (world,targetX,targetY, x, y,size,family) {
      //console.log("DBT")
      var xPos              = x/scale+(Math.random()*0.1);
      var yPos              = y/scale+(Math.random()*0.1);

      // CREATE BALL
      var fixDef            = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density      = 0.1;
        fixDef.friction     = 0.0;
        fixDef.restitution  = 0.0;
        fixDef.shape        = new Box2D.Collision.Shapes.b2CircleShape(size/scale);
        var bodyDef         = new Box2D.Dynamics.b2BodyDef;
      bodyDef.type          = Box2D.Dynamics.b2Body.b2_dynamicBody;
        bodyDef.position.x  = xPos;
        bodyDef.position.y  = yPos;
        var myobj           = world.CreateBody(bodyDef).CreateFixture(fixDef);

      //CREATE JOIN MOUVEMENT TO TARGET
      var md                = new b2MouseJointDef();
        md.bodyA            = world.GetGroundBody();
        md.bodyB            = myobj.GetBody();
        md.target.Set(xPos,yPos);
        md.collideConnected = true;
        md.maxForce         = 50* myobj.GetBody().GetMass();
        mouseJoint          = world.CreateJoint(md);
      mouseJoint.SetTarget(new b2Vec2(targetX/scale, targetY/scale));

      // ADD INFO IN OBJECT
      myobj.m_userData  = {type:"PieBall",familyID:family,fillColor:colorScale(family)}
      categorys[family].value+=1;
      //setTimeout(function(){mouseJoint.SetTarget(chart.position.x/scale, chart.position.y/scale)},1000);
      categorys[family].joins.push(mouseJoint);

      return myobj;
    },

    createDataBallPie:function (world,target, x, y,size,family) {
      console.log(target)
      var xPos = categorys[family].incomingPoint.x/scale+(Math.random()*2/scale);
      var yPos = categorys[family].incomingPoint.y/scale;

      // CREATE BALL
      var fixDef           = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density     = 0.1;
        fixDef.friction    = 0.0;
        fixDef.restitution = 0.0;
        fixDef.shape       = new Box2D.Collision.Shapes.b2CircleShape(size/scale);

        var bodyDef = new Box2D.Dynamics.b2BodyDef;
      bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

        bodyDef.position.x = xPos;
        bodyDef.position.y = yPos;

      // I need a distinct list with bodies (and not fixtures)
      var myo = world.CreateBody(bodyDef);
        myo.m_userData={type:"PieBall",familyID:family,fillColor:categorys[family].color}

        listBodies.push(myo);
      var myobj = myo.CreateFixture(fixDef);

      //CREATE JOIN MOUVEMENT TO TARGET
      var md = new b2MouseJointDef();
        md.bodyA = world.GetGroundBody();
        md.bodyB = myobj.GetBody();
        md.target.Set(xPos,yPos);

        md.collideConnected = true;
        md.maxForce = 100* myobj.GetBody().GetMass();
        mouseJoint = world.CreateJoint(md);
      mouseJoint.SetTarget(new b2Vec2(target.position.x/scale, target.position.y/scale));

      // ADD INFO IN OBJECT
      myobj.m_userData={type:"PieBall",familyID:family,fillColor:colorScale(family)}
      categorys[family].value+=1;
      //setTimeout(function(){mouseJoint.SetTarget(chart.position.x/scale, chart.position.y/scale)},1000);

      return myobj;
    },

    createDataBall:function (_this, x, y,size) {
      var fixDef      = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density    = 1.0;
        fixDef.friction   = 0.5;
        fixDef.restitution  = 0.2;
        fixDef.shape    = new Box2D.Collision.Shapes.b2CircleShape(size/_this.settings.options.scale);

      var bodyDef = new Box2D.Dynamics.b2BodyDef;
      bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
        bodyDef.position.x = x;//+(Math.random())
        bodyDef.position.y = y;

      var myobj = _this.world.CreateBody(bodyDef).CreateFixture(fixDef)
      myobj.m_userData={type:"PieBall",
                familyID:'family',// add family ///
                fillColor:"rgb(200,0,0)"}// add color

      //console.log(myobj)
      return myobj;
    },

}

})(jQuery);

// ....................................................................
// Stream function
//
// ....................................................................

(function ($) {

$.fn._vs.stream = {
    i:null,
    buffer:[],
    speed:10000/6,
    strategy:null,
    type:null,

    init:function(_this){
      this.speed = _this.settings.data.stream.refresh
      type       = _this.settings.data.stream.provider
    },

    push:function(elements){
      console.log(elements)
      for (var i = elements.length - 1; i >= 0; i--) {
        buffer.push(elements)
      };
    },

    update:function (_this){
      if(type=='generator'){
        for(var i = 0 ; i<_this.settings.data.model.length ; i++) {
         _this.dataFlow[i] = setInterval(
                            (function(i,_this){
                              return function() {
                                _this.settings.data.stream.now++
                                // find the element inside the chart conf files
                                var token = _this.chart[_this.settings.chart.type](_this,'token',i)
                                _this.addToken(token);
                              }
                            })(i,_this)
                            ,this.speed);
        }

      }else if (type=='tokens'){

        _this.dataFlow[0] = setInterval(
                            (function(i,_this){
                              return function() {

                                _this.settings.data.stream.now++
                                //if(){
                                  //console.log('tokens',_this.settings.stream.now)
                                  for(var i = 0 ; i<_this.settings.data.tokens.length ; i++) {
                                     if(_this.settings.data.tokens[i].t==_this.settings.data.stream.now){
                                        _this.addToken(_this.settings.data.tokens[i]);
                                     }
                                  }
                                //}
                              }
                            })(i,_this)
                            ,this.speed);

      }else{
        //console.log('direct no stream')
      }
    },
    generator:function(_this,fn){
      /*
      function sine(){}
      function cosine(){}
      function tane(){}
    */
    },
    test:function (_this){
       _this.tokens.push(
         _this.token.createDataBarBall(
             _this,
             (_this.settings.sedimentation.incoming[i].x+(Math.random()*2)),
             (_this.settings.sedimentation.incoming[i].y+(Math.random()*1)),
              _this.settings.sedimentation.token.size,
              i)
       )
    },
    setSpeed:function(_this,speed){
      speedFlow  = speed;
      for( var i = 0 ; i<categorys.length ; i++) {
        window.clearInterval(dataFlow[i]);
      }
      window.clearInterval(decayFlow);
      dataFlow(categorys);
    }
}


})(jQuery);

(function ($) {

$.fn._vs.decay = {
    tokens:[],
    update:function(_this) {
      var incrementationStrate = 1;
      var top                  = _this.settings.sedimentation.suspension.height
      var height               = _this.settings.height
      var intervalStrate       = _this.settings.sedimentation.token.size/4
      var power                = _this.settings.sedimentation.suspension.decay.power
      var scale                = _this.settings.options.scale
      var limit                = _this.settings.sedimentation.token.size.minimum

      if(power==null){var power = 0}

        for(var b = 0; b < this.tokens.length; b++) {
          var tokenSize  = this.tokens[b].attr("size")
          if(power!=0){
            this.tokens[b].attr("size",tokenSize/power)
          }
           // Flocculate

          if(tokenSize<=limit){
            if (_this.settings.sedimentation.flocculate.strategy!=null){
              _this.flocculate.destroyIt(_this,this.tokens[b]);
              _this.strata.update(_this);
            }
          }
        }
    }
}

})(jQuery);

(function ($) {
$.fn._vs.strata = {

    stratas: [],

    // Create  stratas
	  init:function(_this) {

      if(_this.settings.chart.type!='StackedAreaChart') {

        _this.strata.create_strata(_this);
        return;
      }
      settings = _this.settings;

      // No strata or empty strata, so nothing happens
      if( (typeof(settings.data.strata) != 'function') && (typeof(settings.data.strata) == "undefined" || settings.data.strata.length == 0)) { // || settings.data.strata.length == 0) {

          for (var i=0; i<settings.data.model.length; i++) {

            var defaultStrata = {
                              label: settings.data.model[i].label+"_"+i,
                              category: i,
                              value: function(t, s) { return 0;},
                            }
            _this.strata.stratas[i] = [defaultStrata];
          };

        _this.strata.create_strata(_this);
        return;
      }

      if(typeof settings.data.strata != 'function') {

        // Serialized function in JSON
        if(typeof(settings.data.strata == "object") && typeof(settings.data.strata[0]) != "undefined" && (typeof settings.data.strata[0][0].value != "undefined") && typeof(settings.data.strata[0][0].value == "string")) {

             var NB_STRATA = settings.data.strata[0].length;

            // Create default strata object
            for (var i=0; i<settings.data.model.length; i++) {
              _this.strata.stratas[i] = [];
              // Create default strata object
              for (var n=0; n<NB_STRATA; n++) {
                (function(a,b) {
                  var t=null;
                  if( (typeof settings.data.strata[a] !="undefined") && (typeof settings.data.strata[a][b] !="undefined") && (typeof settings.data.strata[a][b].texture!="undefined"))
                    t = settings.data.strata[a][b].texture;
                     var defaultStrata = {};

                    defaultStrata = {
                                label: settings.data.model[i].label+"_"+a,
                                category: a,
                                texture: t,
                                value: function() { r=eval("f="+settings.data.strata[a][b].value); return r();}
                              }


                  _this.strata.stratas[a].push(defaultStrata);
                 })(i,n);
              }
            }
          _this.strata.create_strata(_this);

          return;
        }

        if(typeof(settings.data.strata[0]) != "undefined" && typeof(settings.data.strata[0][0]) != "undefined" && typeof(settings.data.strata[0][0].initValue != "undefined" ) ) {

          for (var c=0; c<settings.data.model.length; c++) {
            var defaultStrata = {
                              label: settings.data.model[c].label+"_"+c,
                              category: i,
                              value: function(t, s) {
                                if(t.selectAll("category", s)) {

                                  return settings.data.strata[s][0].initValue+t.selectAll("category", s).attr("state").filter(function(d) {if(d==2) return d}).length;
                                } else
                                  return settings.data.strata[s][0].initValue;
                              },
                            }
            _this.strata.stratas[c] = [defaultStrata];
          };
          _this.strata.create_strata(_this);
          return;

        } else if(settings.data.strata[0].length == 0) { // Default bar chart

          // Create default strata object
          for (var i=0; i<settings.data.model.length; i++) {

            var defaultStrata = {
                              label: settings.data.model[i].label+"_"+i,
                              category: i,
                              value: function(t, s) {
                                if(t.selectAll("category", s)) {
                                  return t.selectAll("category", s).attr("state").filter(function(d) {if(d==2) return d}).length;
                                } else
                                  return 0;
                              },
                            }
            _this.strata.stratas[i] = [defaultStrata];
          };
          _this.strata.create_strata(_this);
          return;

        } else {

          var NB_STRATA = settings.data.strata[0].length;
          settings.data.strata_param = settings.data.strata;

          function fstrata() {
            var a = Array();
            for(var s=0; s<mySettings.data.model.length; s++)
              a.push(fstratum(s));
            return a;
          }

      function fstratum(a) {

        var b = Array(NB_STRATA);
        for(var r=0; r<b.length; r++)
            b[r] = Array();

        if(typeof _this != "undefined") {

          var tokens = _this.selectAll("category", s).attr("state").filter(function(d) {if(d==2) return d}).length;

          for(var k=0; k<tokens.length; k++) {
            var tk = tokens[k];


            for(var r=0; r<b.length; r++) {

              if(tk < _this.settings.stream.now-2*(r) && tk >= _this.settings.stream.now-2*(r+1))
                b[b.length-r-1].push(tk)
              }
          }

        }
        var res = Array();

        for(var j=0; j<NB_STRATA; j++) {
          var val = b[j].length;
          (function(v) {
             res.push({value: function() { return v; }, label:"Strata "+j, category:a}) // b[j].length
          })(val);

        }
        return res;
      }

          _this.settings.data.strata = function() {return fstrata()};
          _this.strata.stratas = _this.settings.data.strata();
          _this.strata.create_strata(_this);
         return;
        }

      }

      if((typeof settings.data.strata == 'function') || settings.data.strata[0].length > 0 || _this.strata.stratas.length>0) {

        // Strata have been defined, put them in the internal object
        if(typeof settings.data.strata == 'function' || (settings.data.strata[0].length > 0 && typeof(settings.data.strata[0])=="object")) {

          // Strata have been defined as functions
          if(typeof settings.data.strata == 'function') {
            _this.strata.stratas = settings.data.strata();

          } else if(typeof settings.data.strata[0].value == 'function') {

            for (var i=0; i<settings.data.model.length; i++) {

                  var defaultStrata = {
                                    label: settings.data.model[i].label+"_"+i,
                                    category: i,
                                    initValue: settings.data.model[i].value,
                                    value: function(t, s) {
                                      return settings.data.strata[i];
                                    },
                                  }

                  _this.strata.stratas[i] = [defaultStrata];

            }

          } else { // Numerical values as strata

            for (var i=0; i<settings.data.model.length; i++) {
              var defaultStrata = {
                                label: settings.data.model[i].label+"_"+i,

                                category: i,
                                initValue: settings.data.model[i].value,

                                value: function(t, s) {
                                  if(typeof(t.selectAll("category", s).length) == "undefined")
                                    return this.initValue;
                                  if(t.selectAll("category", s)) {
                                    return this.initValue+t.selectAll("category", s).attr("state").filter(function(d) {if(d==2) return d}).length;
                                  } else
                                    return 0;
                                },
                              }

              _this.strata.stratas[i] = [defaultStrata];
            };
          }
        }
        _this.strata.create_strata(_this);
      }
      // _this.strata.update(_this);
    },

      // select stratas
	    selectAll:function(_this,key,value){
	    	result = []
     		result.attr  = function(key,value,param){
     		  var r=[]
     		  result.forEach(function(i){
     		    q = i.attr(key,value,param)
     		    r.push(q)
     		  })
     		  return r
     		}

      		if(typeof(value) == "undefined" && typeof(key) == "undefined"){
      		  return this.stratas
      		}else{
      		  for (var i = _this.strata.stratas.length - 1; i >= 0; i--) {
      		    if(_this.strata.stratas[i].attr(key) == value){
      		      result.push(_this.strata.stratas[i])
      		      break;
      		    }
      		  }
      		}
      		if(typeof(result[0])=="undefined"){
      		  return false
      		}else{
      		  return result[0];
      		}
	    },

      // Create stratas
	    add:function(_this,setting){

        var strata = function (){}
        strata.myobj = setting

		    strata.attr = function(key,value,param){
            if(typeof(value) == "undefined"){
              if(typeof(this[key])!="undefined"){
               return this[key]()
              }else{
               return this.myobj[key]
              }
            }else{
             if(typeof(this[key])!="undefined"){
              this[key](value,param)
             }else{
              this.myobj[key]=value
            }
           }
           return this
          }
        return strata
	    },

      // remove stratas
	   	remove:function(_this,key,value){

	   	},

  // Returns n layers
  strata_layers: function (_this, n, m, p) {

    // Scales for setting up the strata layers
    var sn = d3.scale.linear().domain([1, m-2]).range([Math.PI/2, 2*Math.PI-Math.PI/2]);
    var logscale = d3.scale.pow().exponent(10).domain([0, m]).range([0,1]);

    return d3.range(n).map(function(i) {
      // For customs layers
      var r = 5*Math.random();

      return d3.range(m).map(function(j) {

        if(_this.settings.sedimentation.aggregation.strataType=="sin") {
        if(i==1) return 20;
          var x = 5+r*5*Math.sin(sn(j))+(i*50);
          if(x<0) return -x; else return x;
        } else if(_this.settings.sedimentation.aggregation.strataType=="log") {
          return i+1;
          //return logscale(j);//logscale(i);
        } else {
          if(typeof(p)=='undefined')
            p=0;
            return _this.strata.stratas[p][i].value(_this, p);
        }
      }).map(stream_index);
    });
    function stream_index(d, i) {
      return {x: i, y: Math.max(0, d)};
    }
  },
  // Strata creation
  create_strata: function(_this) {

            if(_this.settings.chart.type=='StackedAreaChart') {

              // Local variables for clearer code
              var w = _this.settings.chart.width/_this.settings.data.model.length,
                  h = _this.settings.sedimentation.aggregation.height;
              var color = _this.token.colorRange;

            if(typeof _this.settings.options.canvasFirst != "undefined" && _this.settings.options.canvasFirst == false) {

              // Create a .vis element that overlays the canvas
              var vis = d3.select("#"+_this.settings.DOMelement.id)
                .insert("div", ":first-child")
                  .style("position", "absolute")
                  .attr("class", "vis")
                  .style("z-index", 10)
                .append("svg")
                  .attr("width", _this.settings.width)
                  .attr("height", _this.settings.height)
                .append("g")
                  .attr("transform", "translate(" + _this.settings.chart.x + "," + _this.settings.chart.y + ")");
            } else {

              var vis = d3.select("#"+_this.settings.DOMelement.id)
                .append("div")
                  .attr("class", "vis")
                  .style("z-index", 10)
                .append("svg")
                  .attr("width", _this.settings.width)
                  .attr("height", _this.settings.height)
                .append("g")
                  .attr("transform", "translate(" + _this.settings.chart.x + "," + _this.settings.chart.y + ")");
            }

              var sn = _this.strata.stratas[0].length, // number of layers
                  sm = 20; // number of samples per layer
                  smx = sm - 1, smy = 0;


            var sum_strata = _this.strata.stratas.map(
              function(d, i) {
                  for(var v=0, res=0; v<d.length; v++)
                    res+=d[v].value(_this, i);
                  return res;
              });


            var y = d3.scale.linear()
                .domain([0, Math.max(d3.max(sum_strata), _this.settings.sedimentation.aggregation.maxData)])
                .range([0, _this.settings.sedimentation.aggregation.height]);

              // Create a group layer that contains all the future strata groups .gpath
              var g = vis.selectAll("g.gcol")
                  .data(_this.strata.stratas, function(d) {return [d];})
                  .enter()
                .append("g")
                  .attr("transform", function(d, i) {

                    var align = _this.settings.sedimentation.aggregation.height;
                    if(_this.settings.sedimentation.aggregation.invertStrata) {
                      align =2*_this.settings.sedimentation.aggregation.height-y(sum_strata[i]);
                    }
                    return "translate("+(i*w)+", "+(_this.settings.chart.height-align)+")";
                  }).attr("class", function(d,i) { return "gcol col_"+i;});;

              // Group path for each strata group
              var gpath = g.selectAll(".gpath")
                 .data(function(d, i) {
                    var sd = d3.layout.stack().offset("expand")(_this.strata.strata_layers(_this, d.length, sm, i));
                    smy = d3.max(sd, function(d) {
                      return d3.max(d, function(d) {
                        return d.y0 + d.y;
                      });
                    });
                    sd.map(function(d) {d.map(function(d) {d.col=i;return d;});}); // Put col # in data
                    return sd;
                  })
                  .enter().append("g").attr("class", "gpath");


            // Rectangular strata
            var area = d3.svg.area()
                .x(function(d) { return _this.settings.chart.spacer+d.x * (w-2*_this.settings.chart.spacer) / smx; })
                .y0(function(d) { return (h - d.y0 * d.offshit); })
                .y1(function(d) { return (h - (d.y + d.y0) * d.offshit ); });

              var pathlayer = gpath.append("path")
                                .attr("d", function(d,i) {

                                  _this.chartUpdate(i, -y(sum_strata[i])-(h-_this.settings.chart.height));
                                  hh = 0;//_this.settings.chart.height-_this.chart.getPosition(_this)[d[0].col].y;
                                  d.map(function(dd) {
                                    dd.offshit = hh;
                                    return dd;
                                  });
                                  return area(d);
                                });

              // Customize layers with color and texture
              pathlayer.style("fill", function(d,i) {
                if(_this.strata.stratas[d[0].col][i].texture!=null) {
                  return "url(#RectanglePattern_"+d[0].col+"_"+i+")";
                } else {
                  return d3.rgb(color(d[0].col))
                    .darker(_this.strata.stratas[d[0].col].length/2-(i+1)/2); // The more away from the token, the darker
                }
              })
              .attr("class",  function(d,i) { return "gcol col_"+d[0].col+" layer_"+i;});

      // Textures
      var patternWidth = w/1;
      var patternHeight = patternWidth;

      if(typeof _this.settings.data.strata != "undefined") {
        for(var s=0; s<_this.settings.data.strata.length; s++) {
          for(var l=0; l<_this.settings.data.strata[s].length; l++) {
            if(_this.settings.data.strata[s][l].texture!=null) {

              var pattern = vis.append('pattern')
                  .attr('id','RectanglePattern_'+s+"_"+l)
                  .attr('height', patternHeight)
                  .attr('width', patternWidth)
                  .attr('patternTransform', 'translate(0, 0) scale('+_this.settings.data.strata[s][l].texture.size+', '+_this.settings.data.strata[s][l].texture.size+') rotate(0)')
                  .attr('patternUnits','userSpaceOnUse');

              pattern.append('image')
                  .attr('x', 0)
                  .attr('y', 0)
                  .attr('height', patternHeight)
                  .attr('width', patternWidth)
                  .attr('xlink:href', function() { return _this.settings.data.strata[s][l].texture.url;});
            }
          }
        }
      }
            } else if(_this.settings.chart.type=='CircleLayout') {


              // strata
              var svg = d3.select("#"+_this.settings.DOMelement.id)
                .append("div")
                .attr("class", "vis")//.style("margin-top", "-"+_this.settings.height+"px")
                .attr("width", _this.settings.width)
                .attr("height", _this.settings.height)
                .append("svg")
                .attr("width", _this.settings.width)
                .attr("height", _this.settings.height);

              // bubble chart
              if(typeof(_this.settings.chart.treeLayout)!="undefined") {

                for(var i=0; i<_this.settings.data.model.length; i++) {
                  var data =_this.settings.data.strata[i];
                  var color = function(s) { return _this.token.colorRange(i)};
                  _this.strata.create_pie_chart(_this, data, svg, data[0].value, color,
                     ((i+1/2))*_this.settings.chart.width/(_this.settings.data.model.length)+_this.settings.chart.x,
                      _this.settings.chart.y+_this.settings.chart.height/6);
                  }
              } else {
                var data =_this.settings.data.strata.map(function(d) { return {value:d[0].value};});
                  var color = _this.token.colorRange;
                _this.strata.create_pie_chart(_this, data, svg, _this.settings.chart.radius, color,
                 _this.settings.chart.x+_this.settings.chart.width/2,
                 _this.settings.chart.y+_this.settings.chart.height/2);
              }
            }
  },
  create_pie_chart: function(_this, data, svg, r, color, posx, posy) {

    var w = _this.settings.width/_this.settings.data.model.length,
        h = _this.settings.sedimentation.aggregation.height;//_this.settings.height;

    var x = d3.scale.linear()
        .domain([0, _this.settings.data.strata.length-1])
        .range([0, _this.settings.width]);


    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) {return d.value; })])
        .rangeRound([0, h]);

    // CIRCLE
    var wp = _this.settings.width,
        hp = _this.settings.height,
        hhp = _this.settings.sedimentation.aggregation.height;
       //Math.min(w, hh) / 2,
        labelr = r + 30, // radius for label anchor
        donut = d3.layout.pie().sort(null),
        arc = d3.svg.arc().innerRadius(0).outerRadius(r);

    var id=Math.random();
    svg.append("g.arcs_"+id)
        .attr("class", "arcs_"+id);

    var garcs = svg.selectAll(".arcs")
        .data(donut(data.map(function(d, i) { return d.value})))
      .enter().append("svg:g").attr("transform", "translate(" + posx + "," + posy + ")");

    var hh=0;

    // Rectangular strata
    var area = d3.svg.area()
        .x(function(d) { return _this.settings.chart.spacer+d.x * (w-2*_this.settings.chart.spacer) / smx; })
        .y0(function(d) { return (h - d.y0 * hh); }) //hh/smy
        .y1(function(d) { return (h - (d.y + d.y0) * hh ); }); //hh/smy

    var arcs = garcs.append("path")
        .attr("fill", function(d, i) { return color(i); })
        .attr("d", function(d,i) {

          return arc(d);

        })
        .each(function(d) { this._current = d; });


  },
  update: function(_this) {
      // No strata or empty strata, so nothing happens
      if(typeof(_this.strata.stratas) == "undefined" || _this.strata.stratas.length == 0) {
        //TODO: create virtual strata to store all the flocculated ones
        return;
      }

      // If strata are functions, then refresh them
      if(typeof settings.data.strata == 'function') {
        _this.strata.stratas = settings.data.strata();
      }
              var sn = _this.strata.stratas[0].length, // number of layers
                  sm = 20; // number of samples per layer
                  smx = sm - 1, smy = 0;

            // Local variables for clearer code
            var w = _this.settings.chart.width/_this.settings.data.model.length,
                h = _this.settings.sedimentation.aggregation.height;
            var color = _this.token.colorRange;

            // Rectangular strata
            var area = d3.svg.area()
                .x(function(d) { return _this.settings.chart.spacer+d.x * (w-2*_this.settings.chart.spacer) / smx; })
                .y0(function(d) { return (h - d.y0 * d.offshit); })
                .y1(function(d) { return (h - (d.y + d.y0) * d.offshit ); });

            var sum_strata = _this.strata.stratas.map(
              function(d, i) {
                  for(var v=0, res=0; v<d.length; v++) {
                    res+=d[v].value(_this, i);
                  }
                  return res;
              });

            var y = d3.scale.linear()
                .domain([0, Math.max(d3.max(sum_strata), _this.settings.sedimentation.aggregation.maxData)])
                .range([0, _this.settings.sedimentation.aggregation.height]);

            var vis = d3.select("#"+_this.settings.DOMelement.id)

            var g = vis.selectAll("g.gcol")


            if(_this.settings.sedimentation.aggregation.invertStrata) {
                  g.transition().duration(100).attr("transform", function(d, i) {
                    var align = _this.settings.sedimentation.aggregation.height;
                     align =2*_this.settings.sedimentation.aggregation.height-y(sum_strata[i]);
                    return "translate("+(i*w)+", "+(_this.settings.chart.height-(2*_this.settings.sedimentation.aggregation.height-y(sum_strata[i])))+")";
                  });
            }

          // Update the group data model
            var gpath = g.selectAll("path")
               .data(function(d, i) {
                  var sd = d3.layout.stack().offset("expand")(_this.strata.strata_layers(_this, d.length, sm, i));

                  smy = d3.max(sd, function(d) {
                    return d3.max(d, function(d) {
                      return d.y0 + d.y;
                    });
                  });
                  sd.map(function(d) {
                    d.map(function(d) {
                      d.col=i;
                      return d;
                    });
                  }); // Put col # in data
                  return sd;
               });

          if(_this.settings.chart.type=='StackedAreaChart') {
            // Adding strata layers
            var pathlayer = vis.selectAll("path")
              .transition().duration(100).attr("d", function(d,i) {

                if(!_this.settings.sedimentation.aggregation.invertStrata) {
                    _this.chartUpdate(i, -y(sum_strata[i])-(h-_this.settings.chart.height));
                    hh = _this.settings.chart.height-_this.chart.getPosition(_this)[d[0].col].y;
                } else {
                    _this.chartUpdate(i, -2*h+_this.settings.chart.height);
                    hh = y(sum_strata[d[0].col]);
                }
                d.map(function(dd) {
                  dd.offshit = hh;
                  return dd;
                });
              return area(d);
            });
          }
    }
    //return {};
	}
})(jQuery);
(function ($) {
//console.log("flocullate loaded")
$.fn._vs.flocculate = {

    buffer:[],

    init:function(_this){
      //console.log("init flocculate",_this)
      // create one buffer by data model (categorys)
      for (var i =0; i<_this.settings.data.model.length; i++) {
        this.buffer[i] = []
        //console.log(i)
      };
    },


    // OLD STUFF NOT USED
    addtobuffer:function(_this,token){
      c = token.attr("category")
      bufferSize =_this.settings.sedimentation.flocculate.bufferSize
      this.buffer[c].push(token)
      _this.decay.tokens.splice(_this.decay.tokens.indexOf(token),1)
      //
      token.attr("callback","bufferFlocculation",token)

      if(this.buffer[c].length > bufferSize){
        //console.log("order")
        this.update(_this,c,bufferSize)
      }
    },

    destroyIt:function(_this,token){
      token.attr("callback","flocculation",token) // callback
      token.attr("state",2)                       // flocullating state
      //token.myobj=null
     // console.log(token.attr('ID'))
      var del = _this.world.DestroyBody(token.myobj.GetBody());

      return del
    },

    update:function(_this,c,nbtokens) {
      if(_this.settings.sedimentation.flocculate.number==1){
       while(this.buffer[c].length > nbtokens) {
         var token = this.buffer[c].shift();
         this.destroyIt(_this,token)
       }
      }else {
        while(this.buffer[c].length > _this.settings.sedimentation.flocculate.number) {
           var token = this.buffer[c].shift();
           this.destroyIt(_this,token)
        }
      }

    },

    disapear:function(_this,token){
      ///draft doesn't work
       window.setInterval(
        function(){token.update(self);},
         self.settings.options.refresh/2
        );
    },

    all:function(_this) {
      // TODO destroy all
      //console.log(_this.settings.data)
      for (var i = _this.decay.tokens - 1; i >= 0; i--) {
        //console.log(_this.decay.tokens)
        this.update(_this,i,_this.tokens.length);
      };
    },

    strategy:function(){
       if(flocullateBuffer.length>0){
         if (chart.flocullate.strategy=="Size"
           && flocullateBuffer.length>=chart.flocullate.bufferSize){
           //console.log(flocullateBuffer.length);
           flocullateByArray(flocullateBuffer);

         }else if (chart.flocullate.strategy=="Time") {

         }else if (chart.flocullate.strategy=="Height") {

         };
    }

}}



})(jQuery);

(function ($) {

  $.fn._vs.aggregate = {
      defaultSettings:{
    },

  // Returns n layers
	strata_layers: function (_this, n, m, p) {
        var sn = d3.scale.linear().domain([1, m-2]).range([Math.PI/2, 2*Math.PI-Math.PI/2]);
				var logscale = d3.scale.pow().exponent(10).domain([0, m]).range([0,1]);

        return d3.range(n).map(function(i) {
					var r = 5*Math.random();

					return d3.range(m).map(function(j) {

						if(_this.settings.sedimentation.aggregation.strataType=="sin") {
						if(i==1) return 20;
							var x = 5+r*5*Math.sin(sn(j))+(i*50);
							if(x<0) return -x; else return x;
						} else if(_this.settings.sedimentation.aggregation.strataType=="log") {
							return i+1;
							//return logscale(j);//logscale(i);
						} else {
							if(typeof(p)=='undefined')
								p=0;
								return _this.settings.data.strata[p][i].value;
						}
					}).map(stream_index);
				});

				function stream_index(d, i) {
					return {x: i, y: Math.max(0, d)};
				}

			},

      init:function (_this){

      	// Skip layers if no strata is defined
				if(typeof(_this.settings.data.strata)=='undefined' || _this.settings.data.strata.length==0  || _this.settings.data.strata[0].length==0)
					return;

				var color = _this.token.colorRange;


      if(_this.settings.chart.type=='StackedAreaChart') {

        var w = _this.settings.chart.width/_this.settings.data.model.length,
            h = _this.settings.sedimentation.aggregation.height;

        var vis = d3.select("#"+_this.settings.DOMelement.id)
					//.insert("div", ":first-child")
					.append("div")
						.attr("class", "vis")
					//	.style("position", "relative")
						.style("z-index", 10)
          .append("svg")
            .attr("width", _this.settings.width)
            .attr("height", _this.settings.height)

					.append("g")
						.attr("transform", "translate(" + _this.settings.chart.x + "," + _this.settings.chart.y + ")");

        var g = vis.selectAll("g.gcol")
            .data(_this.settings.data.strata, function(d) {return [d];})
            .enter()
          .append("g")
            .attr("transform", function(d, i) {
							return "translate("+(i*w)+", "+(_this.settings.chart.height-_this.settings.sedimentation.aggregation.height)+")";
						}).attr("class", function(d,i) { return "gcol col_"+i;});;

        var data =_this.settings.data.strata.map(function(d) { return {value:d[0].value};});

        var sn = _this.settings.data.strata[0].length, // number of layers
						sm = 20; // number of samples per layer
            smx = sm - 1, smy = 0;

				var hh=0;

				// Rectangular strata
        var area = d3.svg.area()
            .x(function(d) { return _this.settings.chart.spacer+d.x * (w-2*_this.settings.chart.spacer) / smx; })
            .y0(function(d) { return (h - d.y0 * hh); }) //hh/smy
            .y1(function(d) { return (h - (d.y + d.y0) * hh ); }); //hh/smy

        var hhh = [];

        var gpath = g.selectAll("gpath")
             .data(function(d,i) {
                var sd = d3.layout.stack().offset("expand")(_this.aggregate.strata_layers(_this, d.length, sm, i));
                smy = d3.max(sd, function(d) {
                  return d3.max(d, function(d) {
                    return d.y0 + d.y;
                  });
                });
								sd.map(function(d) {d.map(function(d) {d.col=i;return d;});}); // Put col # in data
                return sd;
             })
            .enter().append("g").attr("class", "gpath");

					gpath.append("path")
            .attr("d", function(d,i) {
							hh = _this.settings.chart.height-_this.chart.getPosition(_this)[d[0].col].y;
							return area(d);
          }).style("fill", function(d,i) {
			        if(_this.settings.data.strata[d[0].col][i].texture!=null) {
                return "url(#RectanglePattern_"+d[0].col+"_"+i+")";
              } else {

                return d3.rgb(color(d[0].col))
									.darker(_this.settings.data.strata[d[0].col].length/2-(i+1)/2); // The more away from the token, the darker
              }
            })
						.attr("class",  function(d,i) { return "layer";})
						.attr("class",  function(d,i) { return "col_"+d[0].col+" layer_"+i;});

				// Textures
				// strata.texture: {url:"../..", size:1},
				var patternWidth = w/1;
				var patternHeight = patternWidth;

				for(var s=0; s<_this.settings.data.strata.length; s++) {
					for(var l=0; l<_this.settings.data.strata[s].length; l++) {
						if(_this.settings.data.strata[s][l].texture!=null) {

							var pattern = vis.append('pattern')
									.attr('id','RectanglePattern_'+s+"_"+l)
									.attr('height', patternHeight)
									.attr('width', patternWidth)
									.attr('patternTransform', 'translate(0, 0) scale('+_this.settings.data.strata[s][l].texture.size+', '+_this.settings.data.strata[s][l].texture.size+') rotate(0)')
									.attr('patternUnits','userSpaceOnUse');

							pattern.append('image')
									.attr('x', 0)
									.attr('y', 0)
									.attr('height', patternHeight)
									.attr('width', patternWidth)
									.attr('xlink:href', function() { return _this.settings.data.strata[s][l].texture.url;});
						}
					}
				}

			// PIE CHAR
			} else if(_this.settings.chart.type=='CircleLayout') {

				// strata
        var svg = d3.select("#"+_this.settings.DOMelement.id)
			.append("div")
			.attr("class", "vis")//.style("margin-top", "-"+_this.settings.height+"px")
            .attr("width", _this.settings.width)
            .attr("height", _this.settings.height)
            .append("svg")
            .attr("width", _this.settings.width)
            .attr("height", _this.settings.height);

					// bubble chart
					if(typeof(_this.settings.chart.treeLayout)!="undefined") {

					for(var i=0; i<_this.settings.data.model.length; i++) {
						var data =_this.settings.data.strata[i];
						 var color = function(s) { return _this.token.colorRange(i)};
						_this.aggregate.create_pie_chart(_this, data, svg, data[0].value, color,
						 ((i+1/2))*_this.settings.chart.width/(_this.settings.data.model.length)+_this.settings.chart.x,
						  _this.settings.chart.y+_this.settings.chart.height/6);

						}

					} else {
						var data =_this.settings.data.strata.map(function(d) { return {value:d[0].value};});
							console.log(_this.settings.data.strata, data);
						  var color = _this.token.colorRange;
						_this.aggregate.create_pie_chart(_this, data, svg, _this.settings.chart.radius, color,
						 _this.settings.chart.x+_this.settings.chart.width/2,
						 _this.settings.chart.y+_this.settings.chart.height/2);
					}

				}
      },

			create_pie_chart: function(_this, data, svg, r, color, posx, posy) {

        var w = _this.settings.width/_this.settings.data.model.length,
            h = _this.settings.sedimentation.aggregation.height;//_this.settings.height;
/*
        var vis = d3.select("#"+_this.settings.DOMelement.id)
					.append("div")
						.attr("class", "vis") //.style("margin-top", "-"+_this.settings.height+"px")//+_this.settings.DOMelement.id
          .append("svg")
            .attr("width", _this.settings.width)
            .attr("height", _this.settings.height);

        var g = vis.selectAll("g")
            .data(_this.settings.data.strata, function(d) {return [d];})
            .enter()
          .append("g")
            .attr("transform", function(d, i) {
							return "translate("+(i*w)+", "+(_this.settings.height-_this.settings.sedimentation.aggregation.height)+")";
						});
            */
        var x = d3.scale.linear()
            .domain([0, _this.settings.data.strata.length-1])
            .range([0, _this.settings.width]);


        var y = d3.scale.linear()
            .domain([0, d3.max(data, function(d) {return d.value; })])
            .rangeRound([0, h]);

					/*
        var sn = _this.settings.data.strata[0].length, // number of layers
						sm = 20; // number of samples per layer

        var sdata0 = d3.layout.stack().offset("expand")(strata_layers(sn, sm)),
            sdata1 = d3.layout.stack().offset("expand")(strata_layers(sn, sm)),
            smx = sm - 1, smy = 0;
						   */

				// CIRCLE
        var wp = _this.settings.width,
            hp = _this.settings.height,
            hhp = _this.settings.sedimentation.aggregation.height;
           //Math.min(w, hh) / 2,
            labelr = r + 30, // radius for label anchor
						donut = d3.layout.pie().sort(null),
						arc = d3.svg.arc().innerRadius(0).outerRadius(r);

				var id=Math.random();
				svg.append("g.arcs_"+id)
            .attr("class", "arcs_"+id);

        var garcs = svg.selectAll(".arcs")
            .data(donut(data.map(function(d, i) { return d.value})))
          .enter().append("svg:g").attr("transform", "translate(" + posx + "," + posy + ")");
         /*
        var arcs = garcs.append("path")
            .attr("fill", function(d, i) { return color(i); })
            .attr("d", function(d) {


							return arc(d);

						})
            .each(function(d) { this._current = d; });

						*/
						// END CIRCLE


				var hh=0;

				// Rectangular strata
        var area = d3.svg.area()
            .x(function(d) { return _this.settings.chart.spacer+d.x * (w-2*_this.settings.chart.spacer) / smx; })
            .y0(function(d) { return (h - d.y0 * hh); }) //hh/smy
            .y1(function(d) { return (h - (d.y + d.y0) * hh ); }); //hh/smy

        var arcs = garcs.append("path")
            .attr("fill", function(d, i) { return color(i); })
            .attr("d", function(d,i) {

							/*
.data(function(d,i) {
                var sd = d3.layout.stack().offset("expand")(strata_layers(d.length, sm));
                smy = d3.max(sd, function(d) {
                  return d3.max(d, function(d) {
                    return d.y0 + d.y;
                  });
                });
								sd.map(function(d) {d.map(function(d) {d.col=i;return d;});}); // Put col # in data
                return sd;
             })
						*/
							return arc(d);

						})
            .each(function(d) { this._current = d; });

						/*
        var hhh = [];

        g.selectAll("path")
             .data(function(d,i) {
                var sd = d3.layout.stack().offset("expand")(strata_layers(d.length, sm));
                smy = d3.max(sd, function(d) {
                  return d3.max(d, function(d) {
                    return d.y0 + d.y;
                  });
                });
								sd.map(function(d) {d.map(function(d) {d.col=i;return d;});}); // Put col # in data
                return sd;
             })
            .enter().append("path")
            .attr("d", function(d,i) {
              hh = 450-_this.chart.getPosition(_this)[d[0].col].y;
							return area(d);
          }).style("fill", function(d,i) {
			        if(_this.settings.data.strata[d[0].col][i].texture!=null) {
                return "url(#RectanglePattern_"+d[0].col+"_"+i+")";
              } else {
								// The more away from the token, the darker
                return d3.rgb(color(d[0].col)).darker(_this.settings.data.strata[d[0].col].length/2-(i+1)/2);
              }
            });

*/


      /* else if(_this.settings.chart.type=='CircleLayout2') {

        var data1 = _this.settings.data.strata,
            data = data1,
            data2 = _this.settings.data.strata; // 2nd dataset if we want to update

						console.log("data", data);

        var w = _this.settings.width,
            h = _this.settings.height,
            hh = _this.settings.sedimentation.aggregation.height;
            r = _this.settings.chart.radius,//Math.min(w, hh) / 2,
            labelr = r + 30, // radius for label anchor
						donut = d3.layout.pie().sort(null),
						arc = d3.svg.arc().innerRadius(0).outerRadius(r);

						console.log("donut", donut(data));

						// strata

        var svg = d3.select("#"+_this.settings.DOMelement.id).attr("class", "vis")//.style("margin-top", "-"+_this.settings.height+"px")
          .append("svg:svg")
            .attr("width", w)
            .attr("height", h)
            //.style("position", "absolute")
          .append("svg:g")
            .attr("class", "arcs")
            .attr("transform", "translate(" + (w/2) + "," + (h/2) + ")");

				var ddd = donut(_this.settings.data.strata.map(function(d, i) { return d[0].value}));


        var garcs = svg.selectAll("g")
            .data(donut(data.map(function(d, i) { return d[0].value})))
          .enter().append("svg:g");

        var arcs = garcs.append("path")
            .attr("fill", function(d, i) { return color(i); })
            .attr("d", function(d) {	return arc(d);})
            .each(function(d) { this._current = d; });


				var labels = garcs.append("svg:text")
						.attr("transform", function(d) {
								var c = arc.centroid(d),
										x = c[0],
										y = c[1],
										h = Math.sqrt(x*x + y*y); // pythagorean theorem for hypotenuse
								return "translate(" + (x/h * labelr) +  ',' +
									 (y/h * labelr) +  ")";
						})
						.attr("dy", ".35em")
						.attr("text-anchor", function(d) {
								return (d.endAngle + d.startAngle)/2 > Math.PI ?  // are we past the center?
										"end" : "start";
						})
						.text(function(d, i) { return _this.settings.data.model[i].label; }); //.toFixed(2) if num val

						d3.select(window).on("click", function() {
							data = data === data1 ? data2 : data1; // swap the data
							arcs = arcs.data(donut(data.map(function(d) { return d[0].value}))); // recompute the angles and rebind the data
							arcs.transition().duration(750).attrTween("d", arcTween); // redraw the arcs

							labels.data(donut(data.map(function(d,i) {  return d[0].value})))
								.transition().duration(750).attr("transform", function(d) {
											var c = arc.centroid(d),
													x = c[0],
													y = c[1],
													// pythagorean theorem for hypotenuse
													h = Math.sqrt(x*x + y*y);

											return "translate(" + (x/h * labelr) +  ',' +
												 (y/h * labelr) +  ")";
									})
									.attr("dy", ".35em")
									.attr("text-anchor", function(d) {
											// are we past the center?
											return (d.endAngle + d.startAngle)/2 > Math.PI ?
													"end" : "start";
									})
									.text(function(d, i) { return _this.settings.data.model[i].label}); //d.value.toFixed(2); });
						});

						// Store the currently-displayed angles in this._current.
						// Then, interpolate from this._current to the new angles.
						function arcTween(a) {
							var i = d3.interpolate(this._current, a);
							this._current = i(0);
							return function(t) {
								return arc(i(t));
							};
						}
				}  // end if char/pie layout
				*/

			},

  update : function (_this) {

		if(typeof(_this.settings.data.strata)=='undefined' || _this.settings.data.strata.length==0  || _this.settings.data.strata[0].length==0) // Skip layers if no strata is defined
			return;

		var w = _this.settings.chart.width/_this.settings.data.model.length;
		var h = _this.settings.sedimentation.aggregation.height;

    var x = d3.scale.linear()
        .domain([0, _this.settings.data.strata.length-1])
        .range([0, _this.settings.width]);

    var data =_this.settings.data.strata.map(function(d) { return {value:d[0].value};});

		var sum_strata =_this.settings.data.strata.map(
			function(d) {
					for(var v=0, res=0; v<d.length; v++)
						res+=d[v].value;
					return res;
			});

    var y = d3.scale.linear()
        .domain([0, d3.max(sum_strata)])
        .range([0, _this.settings.sedimentation.aggregation.height]);

    var sn = _this.settings.data.strata[0].length, // number of layers
				sm = 20; // number of samples per layer
				smx = sm - 1, smy = 0;

		var hh=0;

		// Rectangular strata
    var area = d3.svg.area()
        .x(function(d) { return _this.settings.chart.spacer+d.x * (w-2*_this.settings.chart.spacer) / smx; })
        .y0(function(d) { return (h - d.y0 * hh); }) //hh/smy
        .y1(function(d) { return (h - (d.y + d.y0) * hh ); }); //hh/smy

		var vis = d3.select("svg");
    var g = vis.selectAll(".gcol");

		g.data(_this.settings.data.strata, function(d,i) { return [d];});

    var gpath = g.selectAll(".gpath")
         .data(function(d,i) {
            var sd = d3.layout.stack().offset("expand")(_this.aggregate.strata_layers(_this, d.length, sm, i));
            smy = d3.max(sd, function(d) {
              return d3.max(d, function(d) {
                return d.y0 + d.y;
              });
            });
						sd.map(function(d) {d.map(function(d) {d.col=i;return d;});}); // Put col # in data
            return sd;
         });

		gpath.select("path")
			.transition()
            .duration(100)
            .attr("d", function(d,i) {
							_this.chartUpdate(i, -y(sum_strata[i])-(h-_this.settings.chart.height));
							hh = _this.settings.chart.height-_this.chart.getPosition(_this)[d[0].col].y;
							return area(d);
          });
			}
  }
})(jQuery);

(function ($) {

$.fn._vs.chart.StackedAreaChart = function(_this,fn,options) {
  var mouseJointTest;

  this.init = function (_this){
    //console.log('StackedAreaChart Init')
    gravity                 = new _this.phy.b2Vec2(0.001, 10);
    _this.world.m_gravity   = gravity;
    _this.chartPhySetup     = {grounds:[],wall:[]}
    this.setupChartPhysics(_this);
    //dataFlow(categorys);
  };

  this.setupChartPhysics = function(_this){

    // Ground
    var spacer = _this.settings.chart.spacer;
    //console.log(_this.settings.chart)

    // Bounds for bar chart
    var colSize     = (_this.settings.chart.width/_this.settings.data.model.length)
    var colBwid     = spacer;
    var colYpos     = _this.settings.chart.height/2+_this.settings.chart.y

    // height of lift
    var agreHeight  =  _this.settings.chart.height - _this.settings.sedimentation.aggregation.height
    //console.log(agreHeight)

    var tdv = 0;
    for (var i = 0; i <_this.settings.data.model.length; i++) {
      _this.settings.data.model[i].value=0
      if(typeof(_this.settings.data.strata)!="undefined"){
        if(typeof(_this.settings.data.strata[i])!="undefined"){
         for (var j = 0; j <_this.settings.data.strata[i].length; j++) {
          _this.settings.data.model[i].value += _this.settings.data.strata[i][j].value
         }
        }
      }
      tdv += _this.settings.data.model[i].value
    }


    for( var i = 0 ; i<_this.settings.data.model.length+1 ; i++) {
        var colXpos = _this.settings.chart.x+(i*colSize);
        _this.chartPhySetup.wall[i] = this.createMyChartBox (
                          _this,
                          colXpos,
                          colYpos,
                          colBwid,
                          _this.settings.chart.height/2,
                          "wall",
                          _this.settings.chart.wallColor);

        //console.log(colXpos,colYpos)

        // Fix incomming points for tokens
        if(i<_this.settings.data.model.length){
          _this.settings.sedimentation.incoming.point[i]={
                                                    x:colXpos+(colSize/2),
                                                    y:_this.settings.y
                                                    }
        }


        // Create lift
       if(i<_this.settings.data.model.length){
          _this.chartPhySetup.grounds[i] = this.createMyChartBox (
                          _this,
                          colXpos+(colSize/2),
                          _this.settings.chart.height+_this.settings.chart.y+_this.settings.sedimentation.aggregation.height,
                          colSize/2,
                          _this.settings.chart.height,
                          "lift",
                          "rgba(250,250,250,0)");

          // Move Lift to data
          // based on scale (data / all data * height )
          /*
          if(_this.settings.data.model[i].value>=0){
            // ?????
            var liftPosition = (_this.settings.data.model[i].value/tdv*(_this.settings.chart.height-_this.settings.sedimentation.aggregation.height))
          }else{
            var liftPosition = 0
          }*/
          this.update(_this,{cat:i,y:_this.settings.chart.height});
        }
    }
  };

  this.token = function (_this,options){
    //console.log('token query')
    var i = options;
    var token = {

              x:(_this.settings.sedimentation.incoming.point[i].x+(Math.random()*2)),
              y:(_this.settings.sedimentation.incoming.point[i].y+(Math.random()*1)),
              t:_this.now(),
              size:_this.settings.sedimentation.token.size.original,
              category:i,
              lineWidth:0,

            }
    return token;
  }

  this.createMyChartBox = function (_this,x,y,w,h,type,color){
     var scale          = _this.settings.options.scale
     var fixDef         = new _this.phy.b2FixtureDef;
     fixDef.density     = 1.0;
     fixDef.friction    = 0.5;
     fixDef.restitution = 0.2;

     var bodyDef  = new _this.phy.b2BodyDef;
     //create ground
     bodyDef.type   = _this.phy.b2Body.b2_staticBody;
     fixDef.shape   = new _this.phy.b2PolygonShape;
     fixDef.shape.SetAsBox(w/scale, h/scale);
     bodyDef.position.Set(x/scale,y/scale );
     var box        = _this.world.CreateBody(bodyDef).CreateFixture(fixDef);
     box.m_userData = {type:type,fillStyle:color,w:w,h:h,x:x,y:y}
     //console.log(box)
     return box
  }

  this.update = function(_this,options){
    var defaultOptions = {cat:0,y:0}
    if(_this.chartPhySetup.grounds[options.cat]!=null) {
      var myBody = _this.chartPhySetup.grounds[options.cat].GetBody();
      var myPos = myBody.GetWorldCenter();
      myPos.y = (options.y
                + _this.settings.chart.height
                +_this.settings.chart.y
                +_this.settings.sedimentation.aggregation.height)/ _this.settings.options.scale
      myBody.SetPosition(myPos);
      //console.log(myBody)
    }
  }


  this.getPositionOld = function(_this){
    var result =[]
    for (var i = 0; i < _this.chartPhySetup.grounds.length; i++) {
      myElement = _this.chartPhySetup.grounds[i]
      myBody    = myElement.GetBody();
      result.push({
        x:(myBody.GetWorldCenter().x* _this.settings.options.scale),
        y:(myBody.GetWorldCenter().y* _this.settings.options.scale),
        a:myBody.GetAngle(),
        w:myElement.m_userData.w,
        h:myElement.m_userData.h,
        r:myElement.m_userData.r,
      })
    };
   return result
  }


  this.getPosition = function(_this){
    var result =[]
    for (var i = 0; i < _this.chartPhySetup.grounds.length; i++) {
      myElement = _this.chartPhySetup.grounds[i]
      myBody    = myElement.GetBody();
      //console.log("myBody.GetWorldCenter().y",myBody.GetWorldCenter().y)
      result.push({
        x:(myBody.GetWorldCenter().x* _this.settings.options.scale),
        y:(myBody.GetWorldCenter().y* _this.settings.options.scale)
          - _this.settings.chart.height
          - _this.settings.chart.y
          ,
        a:myBody.GetAngle(),
        w:myElement.m_userData.w,
        h:myElement.m_userData.h,
        r:myElement.m_userData.r,
      })
    };
   return result
  }



 if (typeof(fn)!=undefined){
    var result = this[fn](_this,options);
    if (typeof(result)!=undefined){
      return result
    }
  }

}


})(jQuery);

(function ($) {

$.fn._vs.chart.CircleLayout = function(_this,fn,options) {

  var mouseJointTest;
  var csX;
  var csY;
  var treeLayout;
  var initValue  = []; // Initiation des valeurs
  var tdv        = 0;  // Incoming point
  var _this;

  this.init = function (_this,options){
    console.log('Circle Layout Init')
    this._this              = _this
    gravity                 = new _this.phy.b2Vec2(0, 0);    // Zero gravity
    _this.world.m_gravity   = gravity;
    _this.chartPhySetup     = {grounds:[],wall:[]}
    this.treeLayout         = _this.settings.chart.treeLayout;

            for (var i=0; i<_this.settings.data.model.length; i++) {
            _this.settings.data.strata[i][0].value = _this.settings.data.strata[i][0].initValue;
            }

    // process data distribution to form layout
    for (var i = 0; i <_this.settings.data.model.length; i++) {
      //console.log("-->",_this.settings.data.model[i])
      _this.settings.data.model[i].value=0
      for (var j = 0; j <_this.settings.data.strata[i].length; j++) {
         //console.log("-->",_this.settings.data.strata[i][j].value)
        _this.settings.data.model[i].value += _this.settings.data.strata[i][j].value
      }
      //console.log("-->",_this.settings.data.model[i].value)
      initValue.push(_this.settings.data.model[i].value)
      tdv += _this.settings.data.model[i].value
    }

    if(this.treeLayout){
      console.log("ici")
     this.setupBubbleChartPhysics(_this);
    }else{
     this.setupPieChartPhysics(_this);
    }

  };

  this.setupPieChartPhysics = function(_this){

    console.log("w",_this.settings.width)
    // Pivot drawing
    var radius = _this.settings.chart.radius
        csX    = _this.settings.chart.width/2+_this.settings.chart.x
        csY    = _this.settings.chart.height/2+_this.settings.chart.y
    var axis   = pivot(csX,csY,radius, _this.settings.chart.wallColor);

    //targets
    for (var i = 0;  i< _this.settings.data.model.length; i++) {
      _this.settings.sedimentation.incoming.target[i] = {x:csX,y:csY};
    }

    // Separation
    var wall   = []
    var spacer = _this.settings.chart.spacer;

    // Incoming point
    var p      = 0;

    console.log("tdv",tdv)

    if (tdv==0){
      for (var i = 0; i <_this.settings.data.length; i++) {
        initValue[i] = 1;
      }
      tdv = initValue.length
    }

    for (var i = 0; i <initValue.length; i++) {
       v = initValue[i]
       a2 = ((v/2+p)/tdv)*360-90
       p += v
       a = (p/tdv)*360-90
       c = circularCoordinate(a2,radius*5,csX,csY)

    // incomming point setup
       console.log(c)
      _this.settings.sedimentation.incoming.point[i] = c

    // Bounds Wall drawing
    _this.chartPhySetup.grounds[i]= this.createBox(
                  _this,
                  csX,
                  csY,
                  spacer,
                  radius,
                  a,
                  radius,
                  'wall',
                  _this.settings.chart.wallColor);
    }
    console.log("w",_this.settings.chart.width)

  };

  this.update = function(_this,options){
    console.log("update")
    var defaultOptions = {cat:0,r:0}
    options.r-=90
    var angle          = (options.r+90)*(Math.PI/180)

    var c              = circularCoordinate(options.r,
                                    _this.settings.chart.radius,
                                    _this.settings.chart.width/2+_this.settings.chart.x,
                                    _this.settings.chart.height/2+_this.settings.chart.y)

    if(_this.chartPhySetup.grounds[options.cat]!=null) {
      var myBody = _this.chartPhySetup.grounds[options.cat].GetBody();
      var myPos  = myBody.GetWorldCenter();
      var myAngle= myBody.GetAngle()
      //console.log(myAngle)
      myPos.y    = c.y/ _this.settings.options.scale
      myPos.x    = c.x/ _this.settings.options.scale
      myAngle    = angle
      myBody.SetPosition(myPos);
      myBody.SetAngle(myAngle);
      //console.log(myBody)
    }
  }

  // default token for stream
  this.token = function (_this,options){
    var i = options;
    //console.log(options)
    var token = {
              x:(_this.settings.sedimentation.incoming.point[i].x+(Math.random()*2)),
              y:(_this.settings.sedimentation.incoming.point[i].y+(Math.random()*1)),
              t:_this.now(),
              size:_this.settings.sedimentation.token.size.original,
              category:i,
              phy:{
                  density:10,
                  friction:0,
                  restitution:0
              },
              targets:[{
                  //  bizare x/2 or x ...
                  x: _this.settings.sedimentation.incoming.target[i].x,
                  y: _this.settings.sedimentation.incoming.target[i].y
              }]
            }
    return token;
  }

  function circularCoordinate(degree,radius,posX,posY){
      j = degree*Math.PI/180
      var x = (Math.cos(j) * radius)+posX;
      var y = (Math.sin(j) * radius)+posY;
      var c = {x:x,y:y}
      return c
  }

  function pivot (centerSceneX,centerSceneY,radius,color){
    var scale           = _this.settings.options.scale
    var fixDef          = new _this.phy.b2FixtureDef;

    fixDef.density      = 1.0;
    fixDef.friction     = 0.5;
    fixDef.restitution  = 0.2;
    var bodyDef         = new _this.phy.b2BodyDef;
    fixDef.shape        = new _this.phy.b2CircleShape(radius/scale);
    bodyDef.position.Set(centerSceneX/scale, centerSceneY/scale);

    var axis            = _this.world.CreateBody(bodyDef).CreateFixture(fixDef);
    axis.m_userData     = {type:"wall",familyID:null,fillStyle:color,strokeStyle:color,r:radius}
    return  axis;
  }

  this.createBox = function (_this,x,y,w,h,a,r,type,color){
     var scale          = _this.settings.options.scale
     var fixDef         = new _this.phy.b2FixtureDef;
     var c              = circularCoordinate(a,r,x,y)

     fixDef.density     = 1.0;
     fixDef.friction    = 0.5;
     fixDef.restitution = 0.2;

     var bodyDef        = new _this.phy.b2BodyDef;
     var angle          = (a+90)*(Math.PI/180)
     bodyDef.angle      = angle;//a+80 ;
     //create ground
     bodyDef.type       = _this.phy.b2Body.b2_staticBody;
     fixDef.shape       = new _this.phy.b2PolygonShape;
     fixDef.shape.SetAsBox(w/scale, h/scale);
     bodyDef.position.Set(c.x/scale,c.y/scale );
     var box = _this.world.CreateBody(bodyDef).CreateFixture(fixDef);
     box.m_userData = {type:type,fillStyle:color,w:w,h:h,r:r}
     //console.log(box)
     return box
  }

  this.getPosition = function(_this){
    var result =[]
    for (var i = 0; i < _this.chartPhySetup.grounds.length; i++) {
      myElement = _this.chartPhySetup.grounds[i]
      myBody    = myElement.GetBody();
      //console.log(myBody.GetAngle())
      result.push({
        x:(myBody.GetWorldCenter().x* _this.settings.options.scale),
        y:(myBody.GetWorldCenter().y* _this.settings.options.scale),
        a:myBody.GetAngle(),
        w:myElement.m_userData.w,
        h:myElement.m_userData.h,
        r:myElement.m_userData.r,
      })
    };
   return result
  }


//  --------- --------- --------- --------- --------- --------- ---------
// Bubble ---------
  this.setupBubbleChartPhysics= function(_this){
    console.log("setupBubbleChartPhysics")

    var colSize = ( _this.settings.chart.width/ _this.settings.data.model.length)
    var colBwid = _this.settings.chart.spacer
    var colYpos = _this.settings.chart.height/2+_this.settings.y+colBwid
    var Ypos    = 0;//chart.position.y;
    var Xpos    = 0;//chart.position.x;
    var NumCol  = _this.settings.chart.column;
   // console.log(Xpos)
   // console.log( _this.settings.width)

  // array layout
  for( var i = 0 ; i<_this.settings.data.model.length; i++) {

      Xpos =  _this.settings.chart.x+(i%NumCol*colBwid)+(colBwid/2)
      Ypos =  _this.settings.chart.y+Math.floor(i/NumCol)*colBwid+(colBwid/2)
      //console.log("- "+i+" x:"+Xpos+" y:"+Ypos);
      _this.settings.sedimentation.incoming.target[i] = {x:Xpos,y:Ypos};

      pivot[i] = creatMyBubblePivot(Xpos,
                                    Ypos,
                                    _this.settings.chart.spacer,
                                    i);

      _this.settings.data.model[i].incomingPoint = {
                                     x:Xpos,
                                     y:Ypos
                                   };

    }

  }
function creatMyBubblePivot(Xpos,Ypos,radius,id){
   console.log("CreatMyBubblePivot",Xpos,Ypos,radius,id)

   var scale          = _this.settings.options.scale
   var fixDef         = new _this.phy.b2FixtureDef;
   var colorRange     = d3.scale.category10()

    fixDef.density    = 10000;
    fixDef.friction   = 0.0;
    fixDef.restitution= 0.0;

   var bodyDef        = new _this.phy.b2BodyDef;
   fixDef.shape       = new _this.phy.b2CircleShape(radius*scale);
   bodyDef.position.Set(Xpos/scale, Ypos/scale);

   var axis           = _this.world.CreateBody( bodyDef);
   var axisf          = axis.CreateFixture(fixDef);

   console.log(id,colorRange(id))
   axisf.m_userData   = {
                         type:"BubblePivot",
                         familyID:id,
                         fillStyle:_this.settings.chart.wallColor
                        }
   console.log(id,axisf)

   axisf.m_shape.m_radius = _this.settings.data.model[id].value/scale;
   //console.log(Xpos,Ypos)
   return axisf;
}

this.getPivotPosition =function (id){

  //console.log(_this.settings.data.model)

  if(typeof(id)!="undefined"){
    return this.pivot
  } else{
    var result=[];
      for( var i = 0 ; i<_this.settings.data.model.length; i++) {
        result.push(_this.settings.data.model[i])
    }
    return result
  }
}

function updatePivotFixPosition(x,y,id){
    var myBody        = pivot[id].GetBody();
    myBody.SetPosition(new b2Vec2(x/scale, y/scale));
    _this.settings.data.model[id].incomingPoint.x=x;
    _this.settings.data.model[id].incomingPoint.y=y;
    setFlowSpeed(speedFlow);

}
function setPivotPosition(x,y,id){
    for( var i = 0 ; i<categorys[id].joins.length; i++) {
      categorys[id].joins[i].SetTarget(new b2Vec2(x/scale, y/scale));
    }
}
function setPivotRadius(r,id){
    //nBodies[b].m_shape.m_radius
    pivot[id].m_shape.m_radius=r;
}


// Bubble ---------
//  --------- --------- --------- --------- --------- --------- ---------
  if (typeof(fn)!=undefined){
    var result = this[fn](_this,options);
    if (typeof(result)!=undefined){
      return result
    }
  }

}


})(jQuery);
