/* 
TODO - implement some strategy pattern for selecting db engine

DB engines are expected to support:
  - connect (ctx, done)
  - disconnect (ctx, done)
  - createTestCtx (ctx, done)
  - cleanTestCtx (ctx, done)

*/

module.exports = require('./postgres')