module.exports = 
  require('../../../../')/* as if require('mocha-sql') */
    .run(
      [ "./dist/suite.yaml"
      ]
    );