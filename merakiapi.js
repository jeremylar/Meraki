var express = require('express');
var router = express.Router();
const querystring = require('querystring');
var request = require('request-promise');
const fetch = require('node-fetch');
var sendgrid = require('../functions/maintenancenot');
var moment = require('moment-timezone');
var d3 = require("d3");
const axios = require('axios');
const cwoptions = {
    method: 'GET', 
    headers: {
        'authorization' : "basic key",
        'clientId' : '<client id>',
        'Content-Type': 'application/json'
            }
    };
const merakiheaders = {
    method: 'GET',
    headers: {
        "Content-Type": "application/json",
        "X-Cisco-Meraki-API-Key" : "<meraki key>"
    }
};    

var combine = function(cwid,companyname,contactname,summary,notesresponse,configuration){
    return {'ticketId' : cwid,'companyname' : companyname,'contactname' : contactname,'summary' : summary, 'notes': notesresponse, 'configuration':configuration};
};


var createteamsmsg = async function (merakicontent)
{
    

    var url = '<teams webhook url for channel>'
	var headers = {"Content-type": "application/json"}
	var merakiurl = merakicontent.deviceUrl;
	var pretext = "Meraki Equipment Alert " + merakicontent.deviceModel + " Serial: "+merakicontent.deviceName + " at " +merakicontent.networkName;
	var title =  "Meraki Equipment Alert"+ merakicontent.deviceName;
	var Ticket = pretext + " -  " + title + " - " + merakiurl
    //console.log(configjson[0]);
    console.log("Sending Teams MSG");
    
    var data = {
        url : url,
        headers : headers,
        method : 'POST',
        json : { 
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "0076D7",
            "summary": pretext,
            "sections": [
                {
                    "activityTitle": pretext,
                    "activityImage": "https://www.mspnetworks.com/images/logo/meraki_cropped.png",
                    "facts": [
                        {
                            "name": "Device",
                            "value": merakicontent.deviceName
                        },
                        {
                            "name": "Serial",
                            "value": merakicontent.deviceSerial
                        },
                        {
                            "name": "MAC",
                            "value": merakicontent.deviceMac
                        },
                        {
                            "name": "Occurred At",
                            "value": merakicontent.occurredAt
                        },
                        {
                            "name": "Status",
                            "value": merakicontent.alertType
                        },
                        {
                            "name": "NetworkURl",
                            "value": merakicontent.networkUrl
                        }
                    ],
                    "markdown": true
                }
            ]
        }};
    var resp= await request(data).then(function(){return resp;}).catch(function(err){console.log(err)});
   //var respjson = await resp.json(); 
   //console.log("response: "+respjson)

};

async function executeAsyncTask (cwid) {
    const cwserviceurl = await fetch('https://api-na.myconnectwise.net/v4_6_release/apis/3.0/service/tickets/'+cwid,cwoptions);
    const valueA = await cwserviceurl.json();
    const cwnotesurl = await fetch('https://api-na.myconnectwise.net/v4_6_release/apis/3.0/service/tickets/'+cwid+"/notes",cwoptions);
    const valueB = await cwnotesurl.json();
	
    //console.log(({'Serviceticket' : valueA,'Ticket_notes' : valueB}))
    return ({'Serviceticket' : valueA,'Ticket_notes' : valueB})
}
async function groupBy(array){
    return(
        d3.nest()
        .key(function(d) { return d.name; })
        //.key(function(d) { return d.type; })
        .rollup(function(v) { return {
                count: v.length,
                hours: d3.sum(v, function(d) { return d.hours; })
            }; })
        .entries(array)
    )
}


	
router.post('/webhook', async function(req, res, next) {
    var malert = req.body;
    var now = new Date();
	var ClientIPAddress = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
    console.log("Timestamp: "+now+" Client IP: "+ ClientIPAddress);
    console.log(req.body);
    //var teamsmsgcreated = await createteamsmsg(req.body);
    //console.log("Teams Message Creation Output: "+teamsmsgcreated);
    var ticketsummary = "Meraki Equipment Alert " + malert.deviceModel + ", Serial: "+malert.deviceSerial+ ", Name: "+malert.DeviceName+", at "+malert.networkName;
    var ticket = {"summary":"Meraki Alert "+ malert.alertType,"company" :{"id": 250}, "source" : {"name": "APIAlerts"}, "initialDescription" :ticketsummary, "customFields":[{"id": "23","value":malert.deviceSerial},{"id":"24","value":malert.networkId},{"id":"25","value":malert.alertType},{"id":"26","value":malert.alertTypeId},{"id":"27","value":malert.alertLevel}]};
    var cwoptionspostsubmit = {
        method: 'POST',
        body : JSON.stringify(ticket),
        headers: {
            'authorization' : "basic key",
            'clientid': "<client id>",
            'Content-Type': 'application/json'
                }

        };
    var submitticket = await fetch('https://api-na.myconnectwise.net/v4_6_release/apis/3.0/service/tickets/',cwoptionspostsubmit).catch(err => console.error(err));
    var ticketinfo = await submitticket.json();
    console.log(ticketinfo);

    res.status(200).send('POST to MSPNetworks A OK').end();
    //res.render('index', { title: 'MSPNetworks API Node' });
});

router.post('/webhooktest', async function(req, res, next) {
    var malert = req.body;
    var now = new Date();
	var ClientIPAddress = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
    console.log("Timestamp: "+now+" Client IP: "+ ClientIPAddress);
    console.log(req);
    

    res.status(200).send('POST to MSPNetworks A OK').end();
    //res.render('index', { title: 'MSPNetworks API Node' });
});
	

router.get('/getorganizations', async function(req,res){
    var url = "https://api.meraki.com/api/v1/organizations";
    try {
        const response = await axios.get(url,{headers: {
            "Content-Type": "application/json",
            "X-Cisco-Meraki-API-Key" : "<meraki key>"
        }});
        console.log(response.data);
        console.log(response.data.length);
        res.json(response.data);
        } catch (err) {
        // Handle Error Here
        console.error(err);
        }

    });

async function getMerakiOrgs(){
    try {
        var url = "https://api.meraki.com/api/v1/organizations";
        const response = await axios.get(url,{headers: {
            "Content-Type": "application/json",
            "X-Cisco-Meraki-API-Key" : "<meraki key>"
        }});
            return(response.data);
        } catch (err) {
        // Handle Error Here
        console.error(err);
        }
}

async function getMerakiOrgNetworks(orgid){
    try {
        var url = "https://api.meraki.com/api/v1/organizations/"+orgid+"/networks";
        const response = await axios.get(url,{headers: {
            "Content-Type": "application/json",
            "X-Cisco-Meraki-API-Key" : "<meraki key>"
        },validateStatus: () => true});
        if (response.status === 404  ){
        console.log("response is undefined, no networks for org");
        return ("no networks for org");
        }
        else{
        return({'networks' : response.data.length, 'data' : response.data});
        
        }
        } catch (err) {
        // Handle Error Here
        console.error(err);
        }
};

async function getMerakiNetworkAlerts(networkid){
    try {
        var url = "https://api.meraki.com/api/v1/networks/"+networkid+"/alerts/settings";
        const response = await axios.get(url,{headers: {
            "Content-Type": "application/json",
            "X-Cisco-Meraki-API-Key" : "<meraki key>"
        }});
            return(response.data);
        } catch (err) {
        // Handle Error Here
        console.error(err);
        }
}

async function getMxContentFiltering(networkid){
    try {
        var url = "https://api.meraki.com/api/v1/networks/"+networkid+"/appliance/contentFiltering";
        const response = await axios.get(url,{headers: {
            "Content-Type": "application/json",
            "X-Cisco-Meraki-API-Key" : "<meraki key>"
        }});
        
        return(response.data);
    
    } catch (err) {
        // Handle Error Here
        console.error(err);
        return({"blockedUrlCategories": [],
        "blockedUrlPatterns": [],
        "allowedUrlPatterns": []});
        }
}

router.get('/getorganizationsfunc', async function(req,res){
    var orgs = await getMerakiOrgs();
    res.json(orgs);
    });

router.get('/getorgnetfunc', async function(req,res){
    var orgid = req.query.orgid;
    var networks = await getMerakiOrgNetworks(orgid);
    res.json(networks);
});

router.get('/getnetalertsfunc', async function(req,res){
    var netid = req.query.netid;
    var alerts = await getMerakiNetworkAlerts(netid);
    res.json(alerts);
});

router.get('/getcontentfiltering', async function(req,res){
    var netid = req.query.netid;
    var alerts = await getMxContentFiltering(netid);
    
    res.json(alerts);
});

router.get('/getorgallfunc', async function(req,res){
    var orglist =[];
    var networklist = [];
    var orgs = await getMerakiOrgs();
    for (i=0; i<Object.keys(orgs).length;i++ ){
        //orglist.push(orgs[i].name);
        //console.log(orgs[i].id);
        var networks =[];
        networks = await getMerakiOrgNetworks(orgs[i].id);
        console.log(orgs[i].name)
        for (j=0; j<networks.networks;j++){
            var netalerts =[];
            console.log(networks.data[j].id)
            netalerts = await getMerakiNetworkAlerts(networks.data[j].id);
            networklist.push([networks.data[j], netalerts.alerts]);
            //console.log(networks[j]);
        
        }

    }
    console.log(networklist.length)
    res.json(networklist);
});


router.get('/getorgwithnetworks', async function(req,res){
    var networklist = [];
    var orgs = await getMerakiOrgs();
    for (i=0; i<Object.keys(orgs).length;i++ ){
        //orglist.push(orgs[i].name);
        //console.log(orgs[i].id);
        var networks =[];
        networks = await getMerakiOrgNetworks(orgs[i].id);
        console.log(orgs[i].name)
        for (j=0; j<networks.networks;j++){
                console.log(networks.data[j].id)
                networklist.push(networks.data[j]);
            //console.log(networks[j]);
        }

    }
    console.log(networklist.length)
    res.json(networklist);
});

router.get('/getorgallcontentfiltering', async function(req,res){
    var orglist =[];
    var networklist = [];
    
    var orgs = await getMerakiOrgs();
    for (i=0; i<Object.keys(orgs).length;i++ ){
        //orglist.push(orgs[i].name);
        //console.log(orgs[i].id);
        var networks =[];
        networks = await getMerakiOrgNetworks(orgs[i].id);
        console.log(orgs[i].name)
        for (j=0; j<networks.networks;j++){
            var netalerts =[];
            var network={};
            console.log(networks.data[j].id)
            netalerts = await getMxContentFiltering(networks.data[j].id);
            //templist=[networks.data[j]];
            //templist.push([netalerts]);
            //const mergeresult = templist.concat({"blockedUrlCategories":netalerts.blockedUrlCategories,"blockedUrlPatterns":netalerts.blockedUrlPatterns,"allowedUrlPatterns":netalerts.allowedUrlPatterns})
            //templist = (networks.data[j]).concat(netalerts);
            //networklist.push([networks.data[j],netalerts]);
            var network ={
            "id": networks.data[j].id,
            "organizationId": networks.data[j].organizationId,
            "name": networks.data[j].name,
            "productTypes": (networks.data[j].productTypes).toString(),
            "timeZone": networks.data[j].timeZone,
            "url": networks.data[j].url,
            "notes": networks.data[j].notes,
            "blockedUrlCategories":netalerts.blockedUrlCategories.length,
            "blockedUrlPatterns":netalerts.blockedUrlPatterns.length,
            "allowedUrlPatterns":netalerts.allowedUrlPatterns.length
            }

            networklist.push(network);
            //console.log(networks[j]);
        
        }

    }
    console.log(networklist.length)
    res.json(networklist);
});

router.get('/getorgnetworks', async function(req,res){
    var orgid = req.query.orgid;
    //console.log(orgid);
    var url = "https://api.meraki.com/api/v1/organizations/"+orgid+"/networks";
    const response = await fetch(url, merakiheaders);
    const responsejson = await response.json();
    console.log(Object.keys(responsejson).length);
    res.json(responsejson);
});

router.get('/getorgnetworksparam/:id', async function(req,res){
    const id = req.params.id
    //console.log(orgid);
    var url = "https://api.meraki.com/api/v1/organizations/"+id+"/networks";
    const response = await fetch(url, merakiheaders);
    const responsejson = await response.json();
    console.log(Object.keys(responsejson).length);
    res.json(responsejson);
});

router.get('/getorgnetworkalerts', async function(req,res){
var orgalerts=[];
let orgnetworks=[];
//getorganizations https://api.meraki.com/api/v1/organizations
var url = "https://api.meraki.com/api/v1/organizations"
const responseorg = await fetch(url, merakiheaders);
const merakiorgs = await responseorg.json();
//console.log(merakiorgs);
var orgcount = Object.keys(merakiorgs).length
//for each organization get networks
for (var i=0; i<orgcount;i++){
var netcounts = 0;
//console.log(merakiorgs[i].id);
var urlorgnet = "https://api.meraki.com/api/v1/organizations/"+merakiorgs[i].id+"/networks"
const responseorgnet = await fetch(urlorgnet, merakiheaders);
const merakiorgnet = await responseorgnet.json();
netcounts = Object.keys(merakiorgnet).length
//console.log(merakiorgs[i].id);
//console.log(netcounts);
if(netcounts>1)
{
for (var j=0; j<netcounts;j++){
    let networkalerts={orgid:[],networkid:[],alerts:[]};        
        //console.log(merakiorgnet[j].id);
	var netalerturl = "https://api.meraki.com/api/v1/networks/"+merakiorgnet[j].id+"/alerts/settings";
    const responsealerturl = await fetch(netalerturl, merakiheaders);
    const netalertjson = await responsealerturl.json();
    //console.log(netalertjson);
    networkalerts.orgid.push(merakiorgs[i].id);
	networkalerts.networkid.push(merakiorgnet[j].id);
    networkalerts.alerts.push(netalertjson);
    orgnetworks.push(networkalerts);
    //console.log(orgnetworks)
}
}
//orgnetworks[key.id]=merakiorgnet
}
console.log(orgnetworks);
res.json(orgnetworks);
});


module.exports = router;
