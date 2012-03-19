define [
  'jQuery',
  'Underscore', 
  'Backbone',
  "order!aim/conf.js",
  "order!libs/jquery.contextMenu",
], ($, _, Backbone, conf) ->
  "use strict"
  class ThreeNodes.AppSidebar
    constructor: () ->
      _.extend(@, Backbone.Events)
    
    onRegister: () =>
      @init_sidebar_tab_new_node()
      @init_sidebar_search()
      @init_sidebar_toggle()
      @init_sidebar_tabs()
    
    init_sidebar_tabs: () =>
      $("#sidebar").tabs
        fx:
          opacity: 'toggle'
          duration: 100
    
    init_sidebar_toggle: () =>
      $("#sidebar-toggle").click (e) ->
        $t = $("#sidebar")
        o = 10
        if $t.position().left < -20
          $("#sidebar-toggle").removeClass("toggle-closed")
          $t.animate({left: 0}, { queue: false, duration: 140 }, "swing")
          $("#sidebar-toggle").animate({left: 220 + o}, { queue: false, duration: 80 }, "swing")
        else
          $("#sidebar-toggle").addClass("toggle-closed")
          $t.animate({left: -220}, { queue: false, duration: 120 }, "swing")
          $("#sidebar-toggle").animate({left: o}, { queue: false, duration: 180 }, "swing")
    
    filter_list_item: ($item, value) =>
      s = $.trim($("a", $item).html()).toLowerCase()
      if s.indexOf(value) == -1
        $item.hide()
      else
        $item.show()
    
    filter_list: (ul, value) =>
      self = this
      ul_title = ul.prev()
      has_visible_items = false
      
      $("li", ul).each () -> self.filter_list_item($(this), value)
      
      if $("li:visible", ul).length == 0
        ul_title.hide()
      else
        ul_title.show()
    
    init_sidebar_search: () =>
      self = this
      $("#node_filter").keyup (e) ->
        v = $.trim($("#node_filter").val()).toLowerCase()
        if v == ""
          $("#tab-new li, #tab-new h3").show()
        else
          $("#tab-new ul").each () -> self.filter_list($(this), v)
                  
    init_sidebar_tab_new_node: () =>
      self = this
      $container = $("#tab-new")
      
      $container.append("<ul>StartTime: <input id='datepicker' type='text' value=''></ul>")
      $container.append("<ul>Sample Frequency in Seconds: <input id='frequency' type='text' value='1'></ul>")
      # add two unordered lists to the AppSideBar, and an event listener (jQuery.xxx)
      date = new Date()
      $("#datepicker").datetimepicker({
          showSecond: true,
          timeFormat: 'hh:mm:ss'
        })
      $("#datepicker").datetimepicker("setDate", date)
      url = conf.full_server_name + "/aimlist?List"
      serverResponse = null
      ajax = new (window.ActiveXObject or XMLHttpRequest)('Microsoft.XMLHTTP')
      ajax.open 'GET', url, true
      ajax.send null

      ajax.onreadystatechange = ->
        if @readyState is 4
          for nt of ThreeNodes.nodes.types
            $container.append("<h3>#{nt}</h3><ul id='nodetype-#{nt}'></ul>")
            if nt is "AIM"
              #alert "I am in the AI Module load mode!"
              serverResponse = ajax.responseText
              #alert serverResponse
              server_parser = serverResponse.split '\n'
              for aim in server_parser
                #node = gen (aim)
                $("#nodetype-#{nt}", $container).append("<li><a class='button' rel='#{nt}' href='#'>#{aim}</a></li>")        
            else
              #alert "I am in the normal load mode!"
              for node of ThreeNodes.nodes.types[nt]
                #alert typeof node + ": " + node.toString()
                $("#nodetype-#{nt}", $container).append("<li><a class='button' rel='#{nt}' href='#'>#{node.toString()}</a></li>")  
      
         
          $("a.button", $container).draggable
            #revert: "valid"
            #opacity: 0.7
            helper: "clone"
            #revertDuration: 0
            start: (event, ui) ->
              #alert "the generated class is being dragged!"
              $("#sidebar").hide()
          $("#container").droppable
            accept: "#tab-new a.button"
            activeClass: "ui-state-active"
            hoverClass: "ui-state-hover"
            drop: (event, ui) ->
              #alert "the node is dropped!"
              nodename = ui.draggable.attr("rel")
              nodetype = jQuery.trim(ui.draggable.html())
              dx = ui.position.left + $("#container-wrapper").scrollLeft() - 10
              dy = ui.position.top - 10 + $("#container-wrapper").scrollTop()
              #alert nodename + " "+ nodetype + " " + dx + " " + dy 
              self.context.commandMap.execute("CreateNodeCommand", nodename, nodetype, dx, dy)
              $("#sidebar").show()
      
      
      
      
      
      ###
      for nt of ThreeNodes.nodes.types
        $container.append("<h3>#{nt}</h3><ul id='nodetype-#{nt}'></ul>")
        for node of ThreeNodes.nodes.types[nt]
          $("#nodetype-#{nt}", $container).append("<li><a class='button' rel='#{nt}' href='#'>#{ node.toString() }</a></li>")
      
      $("a.button", $container).draggable
        revert: "valid"
        opacity: 0.7
        helper: "clone"
        revertDuration: 0
        scroll: false
        containment: "document"
      
      $("#container").droppable
        accept: "#tab-new a.button"
        activeClass: "ui-state-active"
        hoverClass: "ui-state-hover"
        drop: (event, ui) ->
          #nodegraph.create_node(ui.draggable.attr("rel"), jQuery.trim(ui.draggable.html()), ui.position.left + $("#container-wrapper").scrollLeft() - 10, ui.position.top - 10 + $("#container-wrapper").scrollTop())
          nodename = ui.draggable.attr("rel")
          nodetype = jQuery.trim(ui.draggable.html())
          dx = ui.position.left + $("#container-wrapper").scrollLeft() - 10
          dy = ui.position.top - 10 + $("#container-wrapper").scrollTop() - $("#sidebar").scrollTop()
          self.context.commandMap.execute("CreateNodeCommand", nodename, nodetype, dx, dy)
          $("#sidebar").show()
      ###