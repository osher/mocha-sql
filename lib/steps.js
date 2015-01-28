var fs    = require('fs')
  , path  = require('path')
  , util  = require('util')
  , async = require('async')
  , diff  = require('./diff')
  , db    = require('./db')
  ;
module.exports = stepToTestFunction;

function stepToTestFunction(step, ctx) {
    var type = 
    Object.keys(stepStrategy).filter(function(type) {
        return !!step[type];
    });
    if (type.length > 1) 
        throw new Error(
          [ "Structure Error: cannot decide on step type."
          , "the step can have only one of the following attributes: " + type
          , "step: " 
          , JSON.stringify(step, null, 3)
          ].join("\n")
        );
    if (type.length == 0) {
        throw new Error(
          [ "Structure Error: step type is not recognized."
          , "the step must have one of the following attributes: " 
          , "   ", Object.keys(stepStrategy).join("   ")
          , "step: " 
          , JSON.stringify(step, null, 3)
          ].join("\n")
        );
    }

    return stepStrategy[type[0]](step, ctx);
}

var stepStrategy = 
    { "sql-files" : sql_files_step
    , "sql-file"  : sql_file_step
    , "sql"       : sql_query_step
    , "load"      : load_csv_step
    , "load-csv"  : load_csv_file_step
    };

function sql_files_step(step, ctx) {
    var suite = {};
    step["sql-files"].forEach( function(file) {
        suite[file] = sql_file_step({ "sql-file" : file }, ctx)
    })
    return suite;
}

function sql_file_step(step, ctx) { 
    //read sql file synchronously into step.sql in *construct time*
    
    step.sql = ctx.readFileSync( step["sql-file"] );
    //remove BOM whenever it's there...
    if (step.sql.charCodeAt(0) == 65279) 
        step.sql = step.sql.substr(1);

    if ('undefined' == typeof step.saferun) step.saferun = true;
    if (step.saferun)
        step.sql = db.blockWrap( step.sql );

    console.log("found SQL: %s As %s...", step["sql-file"], JSON.stringify(step.sql).substr(0,30))

    return sql_query_step(step, ctx)
}

function sql_query_step(step, ctx) { 
    //read csv file synchronously into step.expect in *construct time*
    if (step["expect-csv"]) {
        step.expect = csvStrToRecordset( ctx.readFileSync( step["expect-csv"] ), step["1st-row"] == "field names");
        console.log("found CSV: %s with %s rows", step["expect-csv"], step.expect.rows.length);
    }
    
    return function sql_step(done) {
        //run query
        ctx.client.query( step.sql, function(e, r) {
            //expect no errors but error is found
            if (e && !step["expect-error"])
                return done(ctx.error = e);

            //  OR
            //expect step["expect-error"] but got other error
            if (step["expect-error"]) {
                if (!e) {
                    e = new Error("Expected error did not occur:" + step["expect-error"]);
                    return done(ctx.error = e);
                }

                if (-1 == e.message.indexOf( step["expect-error"] ) ) {
                    e = new Error("Expected error with message that contains '" + step["expect-error"] + "' but got  '" + e.message + "'");
                    return done(ctx.error = e);
                }
            }

            if (r && step.expect) 
                ctx.error = validateRecordset(ctx, step, r)

            //validate expected results
            done( ctx.error );
        })
    }
}

function load_csv_file_step(step, ctx) {
    step.load = ctx.readFileSync( step["load-csv"] );
    //remove BOM whenever it's there...
    if (step.load.charCodeAt(0) == 65279) 
        step.load = step.load.substr(1);

    step.load = csvStrToRecordset(step.load, /*with field names:*/ true);
    
    return load_csv_step(step, ctx)
}

function load_csv_step(step,ctx) {
    if (  !step.to 
       || !step.load.rows)
        throw new Error(
          [ "Step of type 'load' must contain: " 
          , "  - a valid recordset descriptor, with: " 
          , "      - a list of rows in attribute 'rows'"
          , "      - a list of field-names in attribute 'fields'"
          , "  - name of table in attribute 'to'"
          , ""
          ]
        );

    return function load_step(done) {
        //TRICKY - it's done this way to reuse the lower drivers values formatting
        var cmd = 
            { name : "INSERT-CSV " + step.to
            , text : 
              util.format( "INSERT INTO %s(%s) VALUES (%s)"
              , step.to
              , step.load.fields.join(',')
              , step.load.fields.map(function(_,ix) { return "$" + (ix+1) }).join(",")
              )
            }
          ;
        async.eachLimit( step.load.rows, 1
        , function(values, next) {
              cmd.values = values;
              ctx.client.query( cmd, next )
          }
        , done
        );
    }
}

/**
    should return a descriptive error when mismatch is found
    should expects records in 'found' by same order they appear in 'expect'
    - developer should use relevant ORDER BY specifiers
 */
var FID = 0;
function validateRecordset(ctx, step, found) {
    var _orig_tostr = Date.prototype.toString;
    
    Date.prototype.toString = function() {
        return util.format(
          "%s-%s-%s %s:%s:%s"
        ,     this.getFullYear()
        , pad(this.getMonth() + 1   )
        , pad(this.getDate()        )
        , pad(this.getHours()       )
        , pad(this.getMinutes()     )
        , pad(this.getSeconds()     )
        )
    }

    var txtExpect = rsToCSV(step.expect)
      , txtFound  = rsToCSV(found)
      ;

    Date.prototype.toString = _orig_tostr

    if (txtFound == txtExpect) 
        return null;

    var ex = [ "Results returned by query do not match expected values in CSV"];
    if (step["sql-file"]) 
        ex.push("  sql-file  : " + ctx.resolvePath( step["sql-file"]   ) );
    else
        ex.push("  sql       : " + step.sql           );

    if (step["expect-csv"]) 
        ex.push("  expect-csv: " + ctx.resolvePath( step["expect-csv"] ) );

    ex.push(
      "  comparison:"                           
    ,    diff.words( txtExpect, txtFound )     
    , ""                                        
    , "  expected is in " + "purple".magentaBG.white 
    , "  found    is in " + "red".redBG.white   
    );
    return new Error( ex.join("\n") );

    function rsToCSV(rs) {
        return rs.rows.map(function(row) {
            return Object.keys(row).map( function(field) { return row[field] } ).join(",")
        }).join("\n")
    }
    function pad(n) {
        return n < 10 ? "0" + n : n
    }
}


function csvStrToRecordset(csv, withFieldNames) {
    if (!csv.trim()) return { rows : [] }
    
    var rset = 
        { rows : 
          csv.replace(/\r/g,"").split("\n").map(function(line) {
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