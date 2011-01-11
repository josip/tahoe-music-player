/** section: Utilities
 *  class da.util.Goal
 *  implements Events, Options
 *  
 *  A helper class which makes it easier to manage async nature of JS.
 *  An Goal consists of several checkpoints, which, in order to complete the goal have to be reached.
 *  
 *  #### Examples
 *    
 *      var travel_the_world = new da.util.Goal({
 *        checkpoints: ["Nicosia", "Vienna", "Berlin", "Paris", "London", "Reykjavik"],
 *        
 *        onCheckpoint: function (city) {
 *          console.log("Hello from " + name + "!");
 *        },
 *        
 *        onFinish: function () {
 *          console.log("Yay!");
 *        },
 *        
 *        afterCheckpoint: {
 *          Paris: function () {
 *            consle.log("Aww...");
 *          }
 *        }
 *      });
 *      
 *      travel_the_world.checkpoint("Nicosia");
 *      // -> "Hello from Nicosia!"
 *      travel_the_world.checkpoint("Berlin");
 *      // -> "Hello from Berlin!"
 *      travel_the_world.checkpoint("Paris");
 *      // -> "Hello from Paris!"
 *      // -> "Aww..."
 *      travel_the_world.checkpoint("London");
 *      // -> "Hello from London!"
 *      travel_the_world.checkpoint("Reykyavik");
 *      // -> "Hello from Paris!"
 *      travel_the_world.checkpoint("Vienna");
 *      // -> "Hello from Vienna!"
 *      // -> "Yay!"
 *    
 **/
da.util.Goal = new Class({
  Implements: [Events, Options],
  
  options: {
    checkpoints: [],
    afterCheckpoint: {}
  },
  /**
   *  da.util.Goal#finished -> Boolean
   *  
   *  Indicates if all checkpoints have been reached.
   **/
  finished: false,
  
  /**
   *  new da.util.Goal([options])
   *  - options.checkpoints (Array): list of checkpoints needed for goal to finish.
   *  - options.onFinish (Function): called once all checkpoints are reached.
   *  - options.onCheckpoint (Function): called after each checkpoint.
   *  - options.afterCheckpoint (Object): object keys represent checkpoints whose functions will be called after respective checkpoint.
   **/
  initialize: function (options) {
    this.setOptions(options);
    this.completedCheckpoints = [];
  },
  
  /**
   *  da.util.Goal#checkpoint(name) -> undefined | false
   *  - name (String): name of the checkpoint.
   *  fires checkpoint, finish
   *  
   *  Registers that checkpoint has been reached;
   **/
  checkpoint: function (name) {
    if(!this.options.checkpoints.contains(name))
      return false;
    if(this.completedCheckpoints.contains(name))
      return false;
    
    this.completedCheckpoints.push(name);
    this.fireEvent("checkpoint", [name, this.completedCheckpoints]);
    
    if(this.options.afterCheckpoint[name])
      this.options.afterCheckpoint[name](this.completedCheckpoints);
    
    if(this.completedCheckpoints.containsAll(this.options.checkpoints))
      this.finish();
  },
  
  finish: function () {
    this.finished = true;
    this.fireEvent("finish");
  }
});
