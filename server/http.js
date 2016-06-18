/**
 * Created by q on 14.05.16.
 */
var HTTP= {
    logHeaders: function (req, res, next) {
        console.log(req.headers);
        next();
    },

    send404:function(req, res, next) {
        res.status(301);
        res.cookie('cookiename', 'cookievalue', { maxAge: 12000 });
        res.send();
    }
};

module.exports=HTTP;