
define(['jQuery', 'Underscore', 'Backbone'], function($, _, Backbone) {
  return ThreeNodes.CSLoginCommand = (function() {

    function CSLoginCommand() {}

    CSLoginCommand.prototype.execute = function() {
      var ident, injector, ng;
      injector = this.context.injector;
      ng = injector.get("NodeGraph");
      ident = 123;
      return $.ajax({
        url: 'cslogin',
        data: 'id=' + ident,
        success: function(data, status, request) {
          alert("http://api.sense-os.nl/oauth/authorize?oauth_token=" + data);
          return redirect("http://api.sense-os.nl/oauth/authorize?oauth_token=" + data);
        }
      });
    };

    return CSLoginCommand;

  })();
});
