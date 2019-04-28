
var mongoose=require('mongoose')
var passport=require('passport')
var express=require('express')
var jwt=require('jsonwebtoken')
var  expressJwt=require('express-jwt')
var router=express.Router()
var cors=require('cors')
var bodyParser=require('body-parser')
var request=require('request')
var twitterConfig=require('./twitter.config.js');
mongoose.connect('mongodb://uphaar23:uphaar23@ds135796.mlab.com:35796/jiitplacement');
var User=require('./mongoose.js');
var passportConfig = require('./passport');
passportConfig();
var app = express();
var corsOption = {
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['x-auth-token']
};
app.use(cors(corsOption));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
var createToken = function(auth) {
  return jwt.sign({
    id: auth.id
  },'capedcrusader',
  {
    expiresIn:3600
  });
};
var generateToken = function (req, res, next) {
  console.log("GENERATING TOKEN")
  req.token = createToken(req.auth);
  console.log(req.token)
  return next();
};
var sendToken = function (req, res) {
  console.log(req.token)
  res.setHeader('x-auth-token', req.token);
  return res.status(200).send(JSON.stringify(req.user));
};
router.route('/twitter/redirect2')
  .post(function(req, res) {
    request.post({
      url: 'https://api.twitter.com/oauth/request_token',
      oauth: {
        oauth_callback: "http%3A%2F%2Flocalhost%3A3000%2Ftwitter-callback",
        consumer_key: twitterConfig.consumerKey,
        consumer_secret: twitterConfig.consumerSecret
      }
    }, function (err, r, body) {
      if (err) {
        return res.send(500, { message: e.message });
      }

      var jsonStr = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
      res.send(JSON.parse(jsonStr));
      console.log(JSON.parse(jsonStr))
    });
  });

  router.route('/twitter')
    .post((req, res, next) => {
      console.log("REQ QUERY IS")
      console.log(req.query)
      request.post({
        url: `https://api.twitter.com/oauth/access_token?oauth_verifier`,
        oauth: {
          consumer_key:twitterConfig.consumerKey,
          consumer_secret:twitterConfig.consumerSecret,
          token: req.query.oauth_token
        },
        form: { oauth_verifier: req.query.oauth_verifier }
      }, function (err, r, body) {
        if (err) {
          return res.send(500, { message: err.message });
        }
        const bodyString = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
        const parsedBody = JSON.parse(bodyString);

        req.body['oauth_token'] = parsedBody.oauth_token;
        req.body['oauth_token_secret'] = parsedBody.oauth_token_secret;
        req.body['user_id'] = parsedBody.user_id;
        next();
      });
    }, passport.authenticate('twitter-token', {session: false}), function(req, res, next) {
        if (!req.user) {
          return res.send(401, 'User Not Authenticated');
        }
        req.auth = {
          id: req.user.id
        };
return next();
},generateToken,sendToken);

var authenticate = expressJwt({
  secret: 'capedcrusader',
  requestProperty: 'auth',
  getToken: function(req) {
    if (req.headers['x-auth-token']) {
      return req.headers['x-auth-token'];
    }
    return null;
  }
});

var getCurrentUser = function(req, res, next) {
  User.findById(req.auth.id, function(err, user) {
    if (err) {
      next(err);
    } else {
      req.user = user;
      next();
    }
  });
};

var getOne=function(req, res)
{
var user=req.user.toObject();
delete user['twitterProvider'];
delete user['__v'];
res.json(user);
};
router.get('/twitter/redirect',authenticate,getCurrentUser,getOne);


app.listen(1111);
