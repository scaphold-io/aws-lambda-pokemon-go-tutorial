'use strict'
import config from './config';
import request from 'request';

function post(body) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            url: config.scapholdUrl,
            json: true,
            body: body
        };
        request(options, function(error, response, body) {
            if (error) {
                return reject(error);
            }
            resolve(body);
        })
    })
}

function main(pokemon) {
    const body = {
        query: `query Viewer ($data: _GeoLocationInput!) {
            viewer {
                getNearestUsersByLocation (location: $data) {
                    dist
                    node {
                        id
                        username
                        location {
                            lon
                            lat
                        }
                    }
                }
            }
        }`,
        variables: {
            "data": {
                "lat": pokemon.location.lat,
                "lon": pokemon.location.lon
            }
        }
    };

    return post(body).then(res => {
        console.log(`Looking for nearest user in: ${JSON.stringify(res)}`);
        let nearestUser;
        if (res.data.viewer.getNearestUsersByLocation.length) {
            nearestUser = res.data.viewer.getNearestUsersByLocation[0].node;
            console.log(`Found nearest user: ${JSON.stringify(nearestUser)}`);
        } else {
            console.log(`Looks like there's no one around.`);
            return resolve("Looks like there's no one around.");
        }

        const sendPushNotificationBody = {
            query: `mutation sendPushNotificationToUserQuery($data: _SendPushNotificationToUserInput!) {
                sendPushNotificationToUser(input: $data) {
                    badge
                    alertBody
                    alertActionLocKey
                }
            }`,
            variables: {
                "data": {
                    "userId": nearestUser.id,
                    "badge": 1,
                    "alertBody": "A new Pokemon appeared near you! It's a Level " + pokemon.level + " " + pokemon.name + " with " + pokemon.health + " health.",
                    "alertActionLocKey": "Catch it!"
                }
            }
        };
        console.log(`Sending data ${JSON.stringify(sendPushNotificationBody)}`);
        return post(sendPushNotificationBody);
    }).then(res => {
        console.log(`Successfully sent push notification and got response: ${JSON.stringify(res)}`);
        return res;
    }).catch(err => {
        console.log(`Error sending push notification: ${err.message}`);
        throw err;
    })
}

/**
 * Lambda handler
 */

console.log("Executing handler...");

exports.handler = function(event, context, callback) {
    console.log("[START] Sending iOS push notifications function started at " + new Date());

    console.log("New Pokemon appeared: " + JSON.stringify(event));
    
    main(event.data).then(done => {
        console.log("Done", done);
        console.log("[END] Congratulations! Sending iOS push notifications function completed successfully at " + new Date());
        context.succeed(done);
    }).catch(err => {
        console.error("Error", err);
        callback(err, '[END] Oh no! Process completed with errors!');
    });
}