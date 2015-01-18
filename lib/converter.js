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
     *copies it to a new tree* (which may be possible to remove as optimization!)
     converts every Array in the tree to suites using suitesArrToSuite(ctx)
 */
function convert(ctx) {
    var o     = ctx.cur[0]
      , suite = ctx.suites[0]
      ;

    if (  !o 
       || 'string'   == typeof o 
       || 'function' == typeof o
       || 'boolean'  == typeof o
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
        ctx.suitefile = suitefile;
        loadSuiteSync(ctx);
        delete ctx.suitefile;
    });
    
    ctx.result = suite;
    return ctx
}

function loadSuiteSync(ctx) { 
    var y = loadYamlSync(ctx.suitefile)
      , m = y.meta || { title: 'suite: ' + suiteFile }
      , s = ctx.suites[0][m.title + ":"] = {}
      ; 

    s.beforeAll = 
      function(done) {
          //  - connects to target db
          //  - leaves connected client on context
          db.connect( ctx, done )
      }
    
    //deduct base from suitefile
    ctx.base = 
      ~ctx.suitefile.indexOf("node_modules")  
      ? ctx.suitefile.replace(
          /^(.*node_modules)[\\/]([^\\/]*)[\\/](.*)$/
        , function(_,node_modules,pkg) { 
              return path.join(node_modules,pkg)
          })
      : "."
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
          //TBD

          // - close connection 
          db.disconnect(ctx, done);
      }
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


