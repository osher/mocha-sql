var path = require('path')
  , fs   = require('fs')
  ;

module.exports = Context;

function Context(value) {
    this.suites = [];
    this.cur    = [];
    if (value) this.push(value);
}

Context.init = function(value) {
    if (Context.cur) {
        Context.cur.push(value)
    }else{ 
        Context.cur = new Context(value)
    }
    return Context.cur;
}

Context.prototype.config = function(args) {
    this.args = args;
    this.target = 
      { host     : this.args.host
      , port     : this.args.port
      , user     : this.args.user     
      , password : this.args.password
      , database : args.database
      }
    this.adminDb = 
      { host     : this.args.host
      , port     : this.args.port
      , user     : 'postgres'
      , password : null
      , database : 'postgres'
      }
}

Context.prototype.push = function(value) {
    this.suites.unshift(this.result = {});
    this.cur.unshift(value);
}

Context.prototype.pop = function() {
    this.cur.shift();
    return this.result = this.suites.shift();
}

Context.prototype.resolvePath = function(file) {
    return path.join(this.base, file )
}

Context.prototype.readFileSync = function(file) {
    return fs.readFileSync( this.resolvePath(file) )+"";
}
