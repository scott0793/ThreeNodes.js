
define(['jQuery', 'Underscore', 'Backbone'], function($, _, Backbone) {
  return ThreeNodes.ExecuteGraph = (function() {

    function ExecuteGraph() {}

    ExecuteGraph.prototype.execute = function() {
      var ajax, injector, ng, node, node_NameAndConnections, node_connection, url, _i, _j, _len, _len2, _ref, _ref2;
      injector = this.context.injector;
      ng = injector.get("NodeGraph");
      alert("Number of nodes: " + ng.nodes.length);
      alert("Number of connections: " + ng.node_connections.length);
      node_NameAndConnections = "";
      _ref = ng.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        node_NameAndConnections = node_NameAndConnections + "aimrun " + node.typename() + " " + node.nid + "\n";
        /*
                for fid in node.rack.node_fields.inputs 
                  alert node.typename()+ "contains the following input fields: "+fid
                
                for fid in node.rack.node_fields.outputs 
                  alert node.typename()+ "contains the following output fields: "+fid
        */
      }
      _ref2 = ng.node_connections;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        node_connection = _ref2[_j];
        node_NameAndConnections = node_NameAndConnections + "aimconnect " + node_connection.from_field.node.typename() + node_connection.from_field.node.nid + " " + node_connection.from_field.name + " " + node_connection.to_field.node.typename() + node_connection.to_field.node.nid + " " + node_connection.to_field.name + "\n";
      }
      alert(node_NameAndConnections);
      url = "http://localhost:8042";
      ajax = new (window.ActiveXObject || XMLHttpRequest)('Microsoft.XMLHTTP');
      ajax.open('POST', url, true);
      return ajax.send(node_NameAndConnections);
    };

    return ExecuteGraph;

  })();
});
