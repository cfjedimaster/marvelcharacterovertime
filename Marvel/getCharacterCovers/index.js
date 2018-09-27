const rp = require('request-promise');
const API_PUB_KEY = process.env.API_PUB_KEY;
const API_PRI_KEY = process.env.API_PRI_KEY;

const  crypto = require('crypto');

module.exports = async function (context, req) {

    /*
    First idea:
    first we do a comic search with a date range of 1950-2090 in an attempt to find the first comic
    this gives us X. We then get 10 comics from X to THIS_YEAR

    Second idea:
    go from THIS_YEAR to THIS_YEAR-- until we get nothing back. 
    however, it's possible for a character to 'go away' for a few years. so maybe we would allow for '3 strikes'
    of no results and only stop when we've hit that limit
    */

    if (req.query.id) {
        let id = req.query.id;

        return new Promise((resolve, reject) => {

            // ok - try to get first issue
            let baseUrl = `https://gateway.marvel.com:443/v1/public/comics?dateRange=1950-01-01%2C2090-01-01&characters=${id}&orderBy=onsaleDate&apikey=${API_PUB_KEY}`;

            let ts = new Date().getTime();
            let hash = crypto.createHash('md5').update(ts + API_PRI_KEY + API_PUB_KEY).digest('hex');
            baseUrl += "&ts="+ts+"&hash="+hash;

            //console.log('baseUrl', baseUrl);

            rp({
                url:baseUrl,
                json:true
            }).then(res => {
                
                let firstDate = '';

                if(res.data && res.data.results && res.data.results.length > 0) {
                    let firstResult = res.data.results[0];
                    // from what I know the type is always onsaleDate
                    firstDate = new Date(firstResult.dates[0].date).getFullYear();
                }

                // no firstDate?
                if(firstDate === '') {
                    context.res = {
                        body: {result:[]},
                        headers: { 'Content-Type':'application/json' }
                    };
                    resolve();
                    //not sure I need this
                    return;
                }

                //temp hack:
                firstDate = 2015;

                //get this year
                let thisYear = new Date().getFullYear();

                console.log('going to go from '+firstDate+ ' to '+thisYear);
                let coverCalls = [];
                for(let x = firstDate; x <= thisYear; x++) {
                    let dateStr = x + '-01-01%2C'+ x + '-12-31';
                    let thisUrl = `https://gateway.marvel.com:443/v1/public/comics?dateRange=${dateStr}&characters=${id}&orderBy=onsaleDate&limit=10&apikey=${API_PUB_KEY}`;

                    let ts = new Date().getTime();
                    let hash = crypto.createHash('md5').update(ts + API_PRI_KEY + API_PUB_KEY).digest('hex');
                    thisUrl += "&ts="+ts+"&hash="+hash;

                    console.log(thisUrl);

                    coverCalls.push(rp({
                        url:thisUrl,
                        json:true
                    }));

                }

                Promise.all(coverCalls).then((data) => {
                    console.log('in the all for calling covers');

                    let results = [];

                    //each index of data is year X, we will return the: year,  [title, cover]
                    for(var x=0;x<data.length;x++) {
                        let item = {};
                        item.year = x + firstDate;
                        item.comics = [];
                        for(var y=0;y<data[x].data.results.length;y++) {
                            let comic = {};
                            comic.title = data[x].data.results[y].title;
                            comic.cover = data[x].data.results[y].thumbnail.path + '.' + data[x].data.results[y].thumbnail.extension;
                            item.comics.push(comic);
                        }
                        results.push(item);
                    }

                    context.res = {
                        body: {result:results},
                        headers: { 
                            'Content-Type':'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    };
                    resolve();

                }).catch(e => {
                    console.log('error', e);
                });


            });

        
        });
       
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass an id (for the character) on the query string"
        };
    }
};