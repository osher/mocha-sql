var path = require('path')
  , fs   = require('fs')
  , cur  = null
  ;

module.exports = 
  { init    : ctx_init
  , clear   : ctx_clear
  //exposed for testing
  , Context : Context
  };


function ctx_init(value) {
    if (cur) {
        cur.push(value)
    } else { 
        cur = new Context(value)
    }
    return cur;
}

function ctx_clear(value) {
    cur = null;
}

function Context(value) {
    this.suites = [];
    this.cur    = [];
    this.base   = ".";

    if (value) this.push(value);
}

Context.prototype.config = function(args) {
    this.args = args;

    //support dependency injection of env
    var env = arguments[1];
    if (!env) env = process.env;

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
      , user     : env.PSQL_CI_USER || env.PGUSER     || 'postgres'
      , password : env.PSQL_CI_PWD  || env.PGPASSWORD || null
      , database : env.PSQL_CI_DB   || env.PGDATABASE || 'postgres'
      };
    
    this.base = args.base
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
