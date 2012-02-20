# AIM on top of ThreeNodes.js

AIM, Artificial Intelligence Modules, is a GUI (graphical user interface) for connecting AI modules with each other. We thankfully make use of the ThreeNodes.js GUI (a link can be found below). Instead of data processing in the browser or on the server you connect to, the AIM GUI allows you to mix-and-match modules on a remote server where data is passed between these modules over for example TCP/IP sockets.

## Live demo of ThreeNodes.js
Live demo: http://idflood.github.com/ThreeNodes.js/

## Key principles
- javascript server for AI module management
- wrappers to connect to sensors/actuators online
- ability to connect AI modules that conform to a certain middleware (currently YARP), extensions are easy

## Development setup
Installation is quite involved but is much easier using "npm":

1. install node.js 0.4.x (http://nodejs.org/)
2. install npm (https://github.com/isaacs/npm)
3. install compass/coffeescript (http://compass-style.org/ and http://jashkenas.github.com/coffee-script/)
4. cd in ThreeNodes
5. npm install require express haml jade everyauth sass vogue watch mongoose-auth

You can check the result in the directory node_modules

## Usage
1. cd in ThreeNodes
2. node server.js
3. with firefox or chrome go to http://local.host:8042/

## Copyrights
The copyrights for ThreeNodes.js belong to idflood, the author. The copyrights (2012) for the additional functionality belongs to: 
  Authors: Anne van Rossum, Hongliang (Scott) Guo
  Almende B.V.
  Rotterdam, The Netherlands
