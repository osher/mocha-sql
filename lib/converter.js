var fs    = require('fs')
  , path  = require('path')
  , yaml  = require('js-yaml')
  , db    = require('./db')
  , steps = require('./steps')
  ;
module.exports = convert;

/**
   TRICKY: 
     this function recurses over the provided tree, 
     *copies it to a new tree* 
     and converts every Array in the tree to suites using suitesArrToSuite(ctx)
 */
function convert(ctx) {
    var o     = ctx.cur[0]
      , suite = ctx.suites[0]
      ;

    if (  !o 
       || 'string'   == typeof o 
       || 'function' == typeof o
       || 'boolean'  == typeof o
       || 'number'   == typeof o
        ) { 
        ctx.result = o;
        return ctx;
    }
    
    if (Array.isArray(o)) {
        suitesArrToSuite(ctx);
        return ctx
    }
    
    Object.keys(o).forEach(function(k) {
        ctx.push(o[k]);
        convert(ctx);
        suite[k] = ctx.result;
        ctx.pop();
    });
    ctx.result = suite;
    return ctx
}


function suitesArrToSuite(ctx) {
    var o = ctx.cur[0]
      , suite = ctx.suites[0]
      ;
    
    o.forEach( function(suitefile) {
        loadSuiteSync(ctx, suitefile);
    });
    
    ctx.result = suite;
    return ctx
}

function loadSuiteSync(ctx, suitefile) { 
    var y = loadYamlSync(path.join( ctx.base, suitefile))
      , m = y.meta || { title: 'suite: ' + suitefile }
      , s = ctx.suites[0][m.title + ":"] = {}
      , root = ctx.base
      ; 

    s.beforeAll = 
      function(done) {
          //  - connects to target db
          //  - leaves connected client on context
          db.connect( ctx, done )
      }
    
    //deduct `base` from suitefile as root of the package of that suitefile
    ctx.base = 
      ~suitefile.indexOf("node_modules")  
      ? suitefile.replace(
          /^(.*node_modules)[\\/]([^\\/]*)[\\/](.*)$/
        , function(_,node_modules,pkg) { 
              return path.join(node_modules,pkg)
          })
      : "."
    //mount on `base` the base from the suite's `meta` section
    ctx.base = path.join( ctx.base, y.meta.base || ".");


    // -- scenario ----
    Object.keys(y).forEach( function(scenarioName) {
        if (scenarioName == 'meta') return;

        var scenario = s[ scenarioName + ":" ] = {};
        // -- section ----
        Object.keys(y[scenarioName]).forEach( function(sectionName) {
            var sectionArr = y[scenarioName][sectionName]
              , section
              ;

            section = scenario[sectionName+":"] = {}
            
            // -- step ----
            sectionArr.forEach( function(step, ix) {
                step.section  = sectionName;
                step.scenario = scenarioName;
                try {
                    section[step.title || step.ttl || ("untitled step " + ix)] = 
                      steps(step, ctx);
                } catch (ex) {
                  throw ex;
                    ex = 
                      new Error(
                          ex.message 
                      + "\nstep:\n" + JSON.stringify(step, null, 3) 
                      + "\nmeta:\n" + JSON.stringify(y.meta, null, 3) + "\n\n"
                      );
                    throw ex;
                }

            })
            // -- /step ----
        })
        // -- /section ----
    });
    // -- /scenario ----

    s.afterAll = 
      function(done) {
          //use connection in ctx

          if (!ctx.client) return done();

          // - chose if to commit or rollback
          db[ctx.error ? "rollback" : "commit" ](ctx, done);
      }
    
    ctx.base = root;
    return ctx
}

function loadYamlSync(file) {
    var s, y;
    try {
        s = fs.readFileSync(file);
        y = yaml.safeLoad(s);
    } catch (ex) {
        ex.message += "\n\nfile: " + file;
        throw ex;
    }
    return y;
}


