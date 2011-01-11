var test_Goal = new function () {
  var Goal = da.util.Goal,
      self = this;
  this.test_setup = function () {
    self.timestamps = {};
    self.calls = {a: 0, b: 0, c: 0, afterC: 0, success: 0, setup: 0};
    self.calls.setup++;
    self.goal = new Goal({
      checkpoints: ["a", "b", "c"],
      
      onCheckpoint: function (name) {
        self.timestamps[name] = new Date();
        self.calls[name]++;
      },
      
      onFinish: function (name) {
        self.timestamps.success = new Date();
        self.calls.success++;
      },
      
      afterCheckpoint: {
        c: function () {
          self.timestamps.afterC = new Date();
          self.calls.afterC++;
        }
      }
    });
    
    self.goal.checkpoint("b");
    self.goal.checkpoint("c");
    self.goal.checkpoint("a");
  
    self.goal.checkpoint("c");
    self.goal.checkpoint("b");
  };
  
  this.test_allEventsCalledOnce = function () {
    jum.assertTrue(self.calls.a        === 1);
    jum.assertTrue(self.calls.b        === 1);
    jum.assertTrue(self.calls.c        === 1);
    jum.assertTrue(self.calls.afterC   === 1);
    jum.assertTrue(self.calls.success  === 1);
    jum.assertTrue(self.goal.finished);
  };
  
  this.test_timestamps = function () {
    jum.assertTrue(self.timestamps.b <= self.timestamps.c);
    jum.assertTrue(self.timestamps.c <= self.timestamps.a);
    jum.assertTrue(self.timestamps.c <= self.timestamps.afterC);
  };
  
  this.test_successCalls = function () {
    jum.assertTrue(self.timestamps.success >= self.timestamps.a);
    jum.assertTrue(self.timestamps.success >= self.timestamps.b);
    jum.assertTrue(self.timestamps.success >= self.timestamps.c);
    jum.assertTrue(self.timestamps.success >= self.timestamps.afterC);
  };
};
