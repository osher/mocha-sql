var path = require('path')
  , fs   = require('fs')
  ;

module.exports = Context;

function Context(value) {
    this.suites = [];
    this.cur    = [];
    this.base   = ".";

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

    /**
      target db & user
     */
    this.target = 
      { host     : this.args.host
      , port     : this.args.port
      , user     : this.args.user     
      , password : this.args.password
      , database : args.database
      };
    /**
      Continuous integration db & user
      used only in context of in-build CI to setup DB and drop it 
     */
    this.ciAdmin = 
      { host     : this.args.host
      , port     : this.args.port
      , user     : process.env.PSQL_CI_USER || 'postgres'
      , password : process.env.PSQL_CI_PWD  || null
      , database : 'postgres'
      }
}

/**
   contextualization for convert
 */
Context.prototype.push = function(value) {
    this.suites.unshift(this.result = {});
    this.cur.unshift(value);
}
/**
   contextualization for convert
 */
Context.prototype.pop = function() {
    this.cur.shift();
    return this.result = this.suites.shift();
}

/**
    resolves files relative to the currently executing ymal
 */
Context.prototype.resolvePath = function(file) {
    return path.join(this.base, file )
}

/**
    reads files relative to the currently executing ymal
 */
Context.prototype.readFileSync = function(file) {
    return fs.readFileSync( this.resolvePath(file) )+"";
}
