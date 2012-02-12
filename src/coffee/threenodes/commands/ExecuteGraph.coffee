define [
  'jQuery',
  'Underscore', 
  'Backbone',
], ($, _, Backbone) ->
  class ThreeNodes.ExecuteGraph
    execute: () ->
      injector = @context.injector
      ng = injector.get("NodeGraph")
      
      alert "Number of nodes: " + ng.nodes.length
      alert "Number of connections: " + ng.node_connections.length
      
      node_NameAndConnections = ""
      
      for node in ng.nodes
        node_NameAndConnections = node_NameAndConnections + "aimrun " +node.typename()+" "+node.nid+"\n"
        # node_NameAndConnections = node_NameAndConnections + "ls" + "\n"
        
        
        #alert node.typename() 
        #alert node.nid 
        #alert node.typename()
        
        ###
        for fid in node.rack.node_fields.inputs 
          alert node.typename()+ "contains the following input fields: "+fid
        
        for fid in node.rack.node_fields.outputs 
          alert node.typename()+ "contains the following output fields: "+fid
        ###
        
             
      
      
      for node_connection in ng.node_connections
        # alert "From Field: " + node_connection.from_field.fid + "\nTo Field: " + node_connection.to_field.fid
        # alert "From Node name: "+ node_connection.from_field.node.typename()
        # alert "To Node name: "+ node_connection.to_field.node.typename()
        node_NameAndConnections = node_NameAndConnections + "aimconnect "+node_connection.from_field.node.typename()+node_connection.from_field.node.nid+" "+node_connection.from_field.name+" "+node_connection.to_field.node.typename()+node_connection.to_field.node.nid+" "+node_connection.to_field.name+"\n"
      
      alert node_NameAndConnections
      
      
      url = "http://localhost:8042"
      ajax = new (window.ActiveXObject or XMLHttpRequest)('Microsoft.XMLHTTP')
      ajax.open 'POST', url, true
      ajax.send node_NameAndConnections
      