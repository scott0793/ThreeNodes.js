ThreeNodes = {}

# disable websocket by default since this makes firefox sometimes throw an exception if the server isn't available
# this makes the soundinput node not working
ThreeNodes.websocket_enabled = false

ThreeNodes.nodes =
  fields: {}
  types:
    AIM: {}
#    Base: {}
#    Math: {}
#    Utils: {}
#    Conditional: {}
#    Spread: {}
#    Geometry: {}
#    Three: {}
#    Materials: {}
#    Lights: {}
#    PostProcessing: {}
#    Particle: {}

ThreeNodes.sound_nodes = []

ThreeNodes.mouseX = 0
ThreeNodes.mouseY = 0

ThreeNodes.is_playing = true

ThreeNodes.fields =
  types: {}

ThreeNodes.webgl_materials_node = []
ThreeNodes.svg = false
ThreeNodes.flash_sound_value =
  kick: 0
  snare: 0
  hat: 0

define [
  'jQuery',
  'Underscore', 
  'Backbone',
  'order!threenodes/core/NodeGraph',
  'order!threenodes/ui/AppUI',
  'order!threenodes/ui/AppTimeline',
  'order!threenodes/utils/AppWebsocket',
  'order!threenodes/utils/Injector',
  'order!threenodes/utils/CommandMap',
  'order!threenodes/utils/FileHandler',
  'order!threenodes/commands/ClearWorkspaceCommand',
  'order!threenodes/commands/AddConnectionCommand',
  'order!threenodes/commands/RemoveConnectionCommand',
  'order!threenodes/commands/CreateNodeCommand',
  'order!threenodes/commands/SaveFileCommand',
  'order!threenodes/commands/LoadLocalFileCommand',
  'order!threenodes/commands/RebuildShadersCommand',
  'order!threenodes/commands/RemoveSelectedNodesCommand',
  'order!threenodes/commands/SetDisplayModeCommand',
  'order!threenodes/commands/InitUrlHandler',
  'order!threenodes/commands/ExportCodeCommand',
  'order!threenodes/commands/ExportImageCommand',
  'order!threenodes/commands/OnUiResizeCommand',
  'order!threenodes/commands/CSLoginCommand'
  'order!threenodes/commands/ExecuteGraph',
  "order!libs/jquery.ba-bbq.min",
  "order!libs/jquery-ui/js/jquery-ui-1.9m6.min",
  "order!libs/jQuery-Timepicker-Addon/jquery-ui-timepicker-addon"
], ($, _, Backbone, NodeGraph, AppUI) ->
  "use strict"
  class ThreeNodes.App
    constructor: (@testing_mode = false) ->
      # alert "ThreeNodes app init..."
      @current_scene = false
      @current_camera = false
      @current_renderer = false
      @effectScreen = false
      @renderModel = false
      @composer = false
           
      ThreeNodes.webgl_materials_node = []
      
      @injector = new ThreeNodes.Injector(this)
      @commandMap = new ThreeNodes.CommandMap(this)
      
      @commandMap.register "ClearWorkspaceCommand", ThreeNodes.ClearWorkspaceCommand
      @commandMap.register "AddConnectionCommand", ThreeNodes.AddConnectionCommand
      @commandMap.register "RemoveConnectionCommand", ThreeNodes.RemoveConnectionCommand
      @commandMap.register "CreateNodeCommand", ThreeNodes.CreateNodeCommand
      @commandMap.register "SaveFileCommand", ThreeNodes.SaveFileCommand
      @commandMap.register "LoadLocalFileCommand", ThreeNodes.LoadLocalFileCommand
      @commandMap.register "RebuildShadersCommand", ThreeNodes.RebuildShadersCommand
      @commandMap.register "RemoveSelectedNodesCommand", ThreeNodes.RemoveSelectedNodesCommand
      @commandMap.register "InitUrlHandler", ThreeNodes.InitUrlHandler
      @commandMap.register "SetDisplayModeCommand", ThreeNodes.SetDisplayModeCommand
      @commandMap.register "ExportCodeCommand", ThreeNodes.ExportCodeCommand
      @commandMap.register "ExportImageCommand", ThreeNodes.ExportImageCommand
      @commandMap.register "OnUiResizeCommand", ThreeNodes.OnUiResizeCommand
      @commandMap.register "CSLoginCommand", ThreeNodes.CSLoginCommand
      @commandMap.register "ExecuteGraph", ThreeNodes.ExecuteGraph
      
      @injector.mapSingleton "NodeGraph", ThreeNodes.NodeGraph
      @injector.mapSingleton "AppWebsocket", ThreeNodes.AppWebsocket
      @injector.mapSingleton "AppTimeline", ThreeNodes.AppTimeline
      @injector.mapSingleton "AppUI", AppUI
      @injector.mapSingleton "FileHandler", ThreeNodes.FileHandler
      @injector.mapSingleton "ThreeNodes.WebglBase", ThreeNodes.WebglBase
      
      @nodegraph = @injector.get "NodeGraph"
      @socket = @injector.get "AppWebsocket"
      @webgl = @injector.get "ThreeNodes.WebglBase"
      
      @player_mode = false
            
      if @testing_mode == false
        @ui = @injector.get "AppUI"
        @ui.bind("render", @nodegraph.render)
      else
        $("body").addClass "test-mode"
        @timeline = @injector.get "AppTimeline"
        @commandMap.execute "InitUrlHandler"
      return true
    
    clear_workspace: () ->
      @context.commandMap.execute "ClearWorkspaceCommand"
    
    reset_global_variables: () ->
      ThreeNodes.uid = 0
      @nodegraph.node_connections = []
      @nodegraph.nodes = []
      ThreeNodes.nodes.fields = {}
    
      ThreeNodes.webgl_materials_node = []
