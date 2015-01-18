var fs = require('fs')
  , path = require('path')
  ;
module.exports = stepToTestFunction;

function stepToTestFunction(step, ctx) {
    var type = 
    Object.keys(stepStrategy).filter(function(type) {
        return !!step[type];
    });
    if (type.length > 1) 
        throw new Error(
          [ "Structure Error: cannot decide on step's type."
          , "the step can have only one of the following attributes: " + type
          , "step: " 
          , JSON.stringify(step, null, 3)
          ]
        );

    return stepStrategy[type[0]](step, ctx);
}


var stepStrategy = 
    { "sql"       : sql_query_step
    , "sql-file"  : sql_file_step
    , "sql-files" : sql_files_step
    };

function sql_query_step(step, ctx) { 
    //read csv file synchronously into step.expect in *construct time*
    if (step["expect-csv"]) {
        step.expect = csvStrToRecordset( ctx.readFileSync( step["expect-csv"] ), !step["no-fields"] );
        console.log("found CSV: %s with %s rows", step["expect-csv"], step.expect.rows.length);
    }
    
    return function(done) {
        //run query
        ctx.client.query( step.sql, function(e, r) {
            //expect no errors
            if (e && !step["expect-error"])
                return done(e);

            //  OR
            //expect step["expect-error"]
            if (step["expect-error"]) {
                if (!e) {
                    e = new Error("Expected error did not occur:" + step["expect-error"]);
                    return done(e);
                }

                if (~e.message.indexOf( step["expected-error"] ) ) {
                    e = new Error("Expected error :" + step["expect-error"] + " but got: " + e.message);
                    return done(e);
                }
            }

            //validate expected results
            step.expect


            done();
        })
        
    }
}

function sql_file_step(step, ctx) { 
    //read sql file synchronously into step.sql in *construct time*
    
    step.sql = ctx.readFileSync( step["sql-file"] );
      
    //remove BOM whenever it's there...
    if (step.sql.charCodeAt(0) == 65279) 
        step.sql = step.sql.substr(1);

    console.log("found SQL: %s As %s...", step["sql-file"], JSON.stringify(step.sql).substr(0,30))

    return sql_query_step(step, ctx)
}

function sql_files_step(step, ctx) {
    var suite = {};
    step["sql-files"].forEach( function(file) {
        suite[file] = sql_file_step({ "sql-file" : file }, ctx)
    })
    return suite;
}

function csvStrToRecordset(csv, withFieldNames) {
    if (!csv.trim()) return { rows : [] }
    
    var rset = 
        { rows : 
          csv.split("\n").map(function(line) {
              return line.split(",").map(function(v) {
                  try {
                      return JSON.parse(v)
                  } catch (ex) {
                      return v
                  }
              })
          })
        };
    if (withFieldNames) 
        rset.fields = rset.rows.shift();
    return rset;
}