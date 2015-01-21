var args  = require('../lib/args')
  , fs    = require('fs')
  , spawn = require('child_process').spawn
  , conf_path = "./db-apply.config.json"
  ;

start();

function start() {
    assure_cmd()
}

function assure_cmd() {
    fs.stat("./dist/" + args.cmd + ".js" , function(e) {
        if (e) return console.log("command not supported: %s\n\n", args.cmd) && process.exit(1);

        console.log("applying command : ", args.cmd );
        run_mocha()
    })
}

function run_mocha(e) {
    if (e) return console.log(e) && process.exit(1);
    var switches = (
          [ "dist/" + args.cmd + ".js"
          , "--ui"       , "mocha-ui-exports"
          , "--reporter" , "spec"
          , "--slow"     , 3000
          , "--timeout"  , 6000
          , "--bail"

          , "--host"     , args.h
          , "--port"     , args.p 
          ]
        )
      , cmd = 
        process.platform[0] == "w" //win32|win64|win...
        ? ".\\node_modules\\.bin\\mocha.cmd"
        : "mocha"
      , f
      ;
    if (args.u) switches.push("--user", args.u);
    if (args.w) switches.push("--password", args.w);
    if (args.d) switches.push("--database", args.d);

    console.log("executing...\n=========================================");
    console.log(cmd, switches);
    console.log("=========================================");

    f = spawn(cmd, switches, { customFds: [0,1,2] });
    //f.stdout.on('data', echo);
    //f.stderr.on('data', echo);
    f.on('close', end );
}

function echo(buf) {
    buf = buf+"";
    buf = buf.replace(/\n$/,"");//mocha uses console log, and that adds new line
    buf = buf.replace(/\r/g,"");//god knows where that comes from, but it fucks output
    if (!buf.length) return;
    console.log(buf);
}

function end(code) {
    console.log("\n=========================================\n", code ? "FAILURE" : "SUCCESS!" );
    process.exit(code);
}