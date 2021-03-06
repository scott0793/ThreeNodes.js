define [
  'jQuery',
  'Underscore', 
  'Backbone',
  "order!libs/qunit-git",
], ($, _, Backbone) ->
  "use strict"
  class NodeGraphSpeedTest
    constructor: (app) ->
      ng = app.nodegraph
      injector = app.injector
      filehandler = app.injector.get "FileHandler"
      app.commandMap.execute "ClearWorkspaceCommand"
      
      n1 = ng.create_node("Base", "Number")
      n2 = ng.create_node("Base", "Vector3")
      rnd = ng.create_node("Utils", "Random")
      node_mult = ng.create_node("Math", "Mult")
      
      #n1.v_in.set 2
      node_mult.rack.get("factor").set(3)
      
      injector.instanciate(ThreeNodes.NodeConnection, n1.v_out, node_mult.v_in)
      injector.instanciate(ThreeNodes.NodeConnection, rnd.v_out, n1.v_in)
      ng.render()
      
      JSLitmus.test "Simple math.mult function", () ->
        ng.render()
