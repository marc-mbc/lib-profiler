'use strict';
/**
 * Prepare the profiling logs
 * @param  {Object} config Config object of the micro-service
 * @param  {Object} log    Log object (lib-log)
 */
module.exports.init = function(config, log) {
  // https://www.npmjs.org/package/webkit-devtools-agent-frontend
  // https://github.com/c4milo/node-webkit-agent
  if (config.profiling.webkit) {
    require('webkit-devtools-agent').start({
      port: 9999,
      bind_to: '0.0.0.0',
      ipc_port: 3333,
      false: true
    });
  }
  if (config.profiling.memwatch) {
    var memwatch = require('memwatch');
    var hd = new memwatch.HeapDiff();
    memwatch.on('stats', function (stats) {
      var diff = hd.end();
      hd = new memwatch.HeapDiff();
      var higestMemoryIncrease, higestMemoryDecrease, higestCountIncrease, higestCountDecrease;
      for (var i = diff.change.details.length - 1; i >= 0; i--) {
        // Memory
        if (higestMemoryIncrease === undefined || higestMemoryDecrease === undefined) {
          higestMemoryIncrease = diff.change.details[i];
          higestMemoryDecrease = diff.change.details[i];
        }
        else if (diff.change.details[i].size_bytes > higestMemoryIncrease.size_bytes) {
          higestMemoryIncrease = diff.change.details[i];
        }
        else if (diff.change.details[i].size_bytes < higestMemoryDecrease.size_bytes) {
          higestMemoryDecrease = diff.change.details[i];
        }
        // Count
        if (higestCountIncrease === undefined || higestCountDecrease === undefined) {
          higestCountIncrease = diff.change.details[i];
          higestCountDecrease = diff.change.details[i];
        }
        else if (diff.change.details[i]['+'] - diff.change.details[i]['-'] > 
                higestCountIncrease['+'] - higestCountIncrease['-']) {
          higestCountIncrease = diff.change.details[i];
        }
        else if (diff.change.details[i]['+'] - diff.change.details[i]['-'] < 
                higestCountDecrease['+'] - higestCountDecrease['-']) {
          higestCountDecrease = diff.change.details[i];
        }
      }

      if (config.profiling.details) log.debug(diff.change.details);
      log.debug('Higest memory increase: ', higestMemoryIncrease);
      log.debug('Higest memory decrease: ', higestMemoryDecrease);
      log.debug('Higest count increase: ', higestCountIncrease);
      log.debug('Higest count decrease: ', higestCountDecrease);
      log.debug(stats);
      log.debug('Memory from last gc: ' + diff.before.size + ' Now: ' + diff.after.size + ' Change: ' + diff.change.size);
      log.debug('Freed nodes: ' + diff.change.freed_nodes + ' Allocated nodes: ' + diff.change.allocated_nodes);
    });
  }
}
