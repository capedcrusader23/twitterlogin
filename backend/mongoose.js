
var mongoose = require('mongoose')
var Schema=mongoose.Schema;
var UserSchema = new Schema({
email:{
type:String,
required:true,
trim:true,
unique:true,
},
twitterProvider: {
type:{
id:String,
token:String
},
select: false
}
});
UserSchema.set('toJSON', {getters: true, virtuals: true});
UserSchema.statics.upsertTwitterUser = function(token, tokenSecret, profile, cb) {
var that = this;
return this.findOne({
'twitterProvider.id': profile.id
},function(err, user)
{
if(!user)
{
var newUser = new that({
email:profile.emails[0].value,
twitterProvider:{
id: profile.id,
token: token,
tokenSecret: tokenSecret
}
});
newUser.save(function(error, savedUser) {
if (error)
{
console.log(error);
}
return cb(error, savedUser);
});
}
else
{
return cb(err, user);
}
});
};
const us=mongoose.model('User', UserSchema);
module.exports=us;
