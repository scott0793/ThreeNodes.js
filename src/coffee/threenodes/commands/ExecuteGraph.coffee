define [
  'jQuery',
  'Underscore', 
  'Backbone',
  'order!aim/conf.js',
], ($, _, Backbone,conf) ->
  class ThreeNodes.ExecuteGraph
    execute: () ->
      date1 = $("#datepicker").datetimepicker("getDate")
      unix_time = Date.parse(date1)/1000
      frequency = $("#frequency")
      alert "UnixTimeStamp: "+unix_time+" Frequency: "+frequency.val()
      injector = @context.injector
      ng = injector.get("NodeGraph")
      node_NameAndConnections = "aimconfig " + unix_time + " " + frequency.val()+"\n"
      for node in ng.nodes
        nodeName = node.typename()
        firstTwo = nodeName.substring 0,2
        if firstTwo is "CS"
          f_in = $("#f-txt-input-#{node.typename()}")
          node_NameAndConnections = node_NameAndConnections + "aimrun " +node.typename()+" "+node.nid+" "+f_in.val()+"\n"
        else
          node_NameAndConnections = node_NameAndConnections + "aimrun " +node.typename()+" "+node.nid+"\n"  
      alert node_NameAndConnections
          
        
             
      
      
      for node_connection in ng.node_connections
        # alert "From Field: " + node_connection.from_field.fid + "\nTo Field: " + node_connection.to_field.fid
        # alert "From Node name: "+ node_connection.from_field.node.typename()
        # alert "To Node name: "+ node_connection.to_field.node.typename()
        node_NameAndConnections = node_NameAndConnections + "aimconnect "+node_connection.from_field.node.typename()+node_connection.from_field.node.nid+" "+node_connection.from_field.name+" "+node_connection.to_field.node.typename()+node_connection.to_field.node.nid+" "+node_connection.to_field.name+"\n"
      
      #alert node_NameAndConnections
      #alert conf.full_server_name
      url = conf.full_server_name+"/aimrun?123"
      ajax = new (window.ActiveXObject or XMLHttpRequest)('Microsoft.XMLHTTP')
      ajax.open 'POST', url, true
      ajax.send node_NameAndConnections
      