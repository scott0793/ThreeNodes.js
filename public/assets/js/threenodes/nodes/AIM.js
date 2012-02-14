var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

define(['jQuery', 'Underscore', 'Backbone', "text!templates/node.tmpl.html", "order!libs/jquery.tmpl.min", "order!libs/jquery.contextMenu", "order!libs/colorpicker/js/colorpicker", 'order!threenodes/core/NodeFieldRack', 'order!threenodes/utils/Utils'], function($, _, Backbone, _view_node_template) {
  "use strict";  return ThreeNodes.nodes.types.AIM.Number = (function() {

    __extends(Number, ThreeNodes.NodeNumberSimple);

    function Number() {
      this.set_fields = __bind(this.set_fields, this);
      Number.__super__.constructor.apply(this, arguments);
    }

    Number.prototype.set_fields = function() {
      Number.__super__.set_fields.apply(this, arguments);
      return this.rack.add_center_textfield(this.v_in);
    };

    return Number;

  })();
});
