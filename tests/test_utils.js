var test_StringStrip = function () {
  jum.assertEquals("123ab", "123\0\0a\0\0b".strip());
  jum.assertEquals("abc",   "\0\0\0ab\0c\0\0\0".strip());
  jum.assertEquals("d",     "\0d".strip());
  jum.assertEquals("e ",    "e\0 ".strip());
};

var test_StringInterpolate = new function () {
  this.test_withNoArgs = function () {
    jum.assertEquals("test", "test".interpolate());
  };
  
  this.test_withArray = function () {
    jum.assertEquals("10/100%",   "{0}/{1}%".interpolate([10, 100]));
    jum.assertEquals("100/100%",  "{1}/{1}%".interpolate([10, 100]));
    jum.assertEquals("001011",    "{0}{0}{1}{0}{1}{1}".interpolate([0, 1]));
  };
  
  this.test_withObject = function () {
    jum.assertEquals("Hi John! How are you?", "Hi {name}! How are {who}?".interpolate({
      name: "John",
      who: "you"
    }));
  };
  
  this.test_missingProperties = function () {
    jum.assertEquals("Hi mum! {feeling} to see you!", "Hi {who}! {feeling} to see you!".interpolate({
      who: "mum"
    }));
  };
};

var test_ArrayZip = new function () {
  this.test_oneArg = function () {
    jum.assertEqualArrays([[1]], Array.zip([1]));
  };
  
  this.test_twoArgs = function () {
    jum.assertEqualArrays([[1, 1], [2, 2], [3, 3]], Array.zip([1, 2, 3], [1, 2, 3]));
  };
  
  this.test_moreSimpleArgs = function () {
    jum.assertEqualArrays([[1, 2, 3, 4, 5]], Array.zip([1], [2], [3], [4], [5]));
  };
  
  this.test_notSameLength = function () {
    jum.assertEqualArrays([[1, 2, 4]], Array.zip([1], [2, 3], [4, 5, 6]));
    jum.assertEqualArrays([
      [1, 4, 6],
      [2, 5, undefined],
      [3, undefined, undefined]
    ], Array.zip([1, 2, 3], [4, 5], [6]));
  };
};

var test_ArrayContainsAll = function () {
  jum.assertTrue( []        .containsAll([]       ));
  jum.assertTrue( [1, 2, 3] .containsAll([1, 2, 3]));
  jum.assertTrue( [1, 2, 1] .containsAll([2, 1]   ));
  jum.assertTrue( [1, 2]    .containsAll([1, 2, 1]));
  jum.assertFalse([1, 2]    .containsAll([3, 1, 2]));
};
                                         
var test_HashContainsAll = function () {
  jum.assertTrue( $H({})                .containsAll({}          ));
  jum.assertTrue( $H({a: 1, b: 2, c: 3}).containsAll({a: 1, b: 2}));
  jum.assertFalse($H({a: 1})            .containsAll({a: 1, b: 2}));
  jum.assertFalse($H({a: 1, b: 2})      .containsAll({a: 2, b: 3}));
};
