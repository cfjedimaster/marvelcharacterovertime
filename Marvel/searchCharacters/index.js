const rp = require('request-promise');
const API_PUB_KEY = process.env.API_PUB_KEY;
const API_PRI_KEY = process.env.API_PRI_KEY;

const  crypto = require('crypto');

module.exports = async function (context, req) {

    if (req.query.name) {

        let name = req.query.name;
        let baseUrl = `https://gateway.marvel.com:443/v1/public/characters?nameStartsWith=${encodeURIComponent(name)}&apikey=${API_PUB_KEY}`;

        let ts = new Date().getTime();
		let hash = crypto.createHash('md5').update(ts + API_PRI_KEY + API_PUB_KEY).digest('hex');
		baseUrl += "&ts="+ts+"&hash="+hash;

        //console.log('baseUrl', baseUrl);

        return rp({
            url:baseUrl,
            json:true
        }).then(res => {
            //console.log(res.data);
            let results = [];

            if(res.data.total > 0) {
                results = res.data.results.map(r => {
                    return { id:r.id, name: r.name, thumbnail: r.thumbnail.path + '.' + r.thumbnail.extension };
                });
            } 

            context.res = {
                // status: 200, /* Defaults to 200 */
                body: results,
                headers: { 
                    'Content-Type':'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            };

        });
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string"
        };
    }
};