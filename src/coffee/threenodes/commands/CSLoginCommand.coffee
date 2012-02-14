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
      ident = 123
      $.ajax
        url: 'cslogin'
        data: 'id=' + ident
        success: (data, status, request) ->
          window.location.href = "http://api.sense-os.nl/oauth/authorize?oauth_token=" + data
