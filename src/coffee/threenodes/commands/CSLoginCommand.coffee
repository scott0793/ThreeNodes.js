# The CSLoginCommand uses the Javascript libraries jQuery, Underscore and Backbone
# We define the aliases $, _ and just Backbone for them
# The command jQuery.ajax 

define [
  'jQuery',
  'Underscore', 
  'Backbone',
], ($, _, Backbone) ->
  class ThreeNodes.CSLoginCommand
    execute: () ->
      injector = @context.injector
      ng = injector.get("NodeGraph")
      ident = 123
#      alert "Try to login to common sense using fake openid identifier " + ident
#      login_str = "id=" + ident
#      url = "/cslogin?" + login_str
      $.ajax
        url: 'cslogin'
        data: 'id=' + ident
        success: (data, status, request) ->
          alert "http://api.sense-os.nl/oauth/authorize?oauth_token=" + data
          redirect("http://api.sense-os.nl/oauth/authorize?oauth_token=" + data)
      #$.ajax url