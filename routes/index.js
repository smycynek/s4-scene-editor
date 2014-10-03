var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  var homepageData = {
      title : 'Server Template', 
      projectName : 'S4F Editor', 
      projectUrl : './s4f/'
  };
  res.render('index', homepageData);
});

module.exports = router;
