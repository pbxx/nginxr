# What is this? 
<p align="center">
  <img src="https://user-images.githubusercontent.com/5501027/127821923-92bb2bd4-87c7-4a5f-8f4f-f9e70910ea47.png">
</p>

A friendly logger for Node.js, when verbosity is required...

Project still in development...

# Installation 

`npm i kindlogs`

# Getting Started 

```JS
const {KindLogs} = require('kindlogs');

function myFunction() {
    var console = new KindLogs("main > myFunction()")
    console.log('Custom labelled console.log with line and column number')

}

myFunction()
```
