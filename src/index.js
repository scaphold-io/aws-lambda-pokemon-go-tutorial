'use strict'
import config from './config';
import request from 'request';

function main(pokemon) {
    // Note: This is where your main code logic should go.
    return new Promise((resolve, reject) => {
        console.log("Retrieving nearest Pokemon trainers...");

        let query = `query Viewer ($data: _GeoLocationInput!) {
            viewer {
                getNearestUserByLocation (location: $data) {
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
        }`;

        let variables = {
            "data": {
                "lat": pokemon.location.lat,
                "lon": pokemon.location.lon
            }
        };

        let body = {
            query: query,
            variables: variables
        };

        let options = {
            method: 'POST',
            url: config.scapholdUrl,
            json: true,
            body: body
        };
        return request(options, (error, response, body) => {
            if (error) throw new Error(error);
            console.log(JSON.stringify(body));
            console.log("Sending iOS push notifications to nearest Pokemon trainer...");

            query = `mutation SendPushNotificationToUser($data: _SendPushNotificationToUserInput!){
                sendPushNotificationToUser(input: $data){
                    badge
                    alertBody
                    alertActionLocKey
                }
            }`;

            variables = {
                "data": {
                    "userId": body.data.viewer.getNearestUserByLocation[0].node.id,
                    "badge": 1,
                    "alertBody": "A new Pokemon appeared near you! It's a Level " + pokemon.level + " " + pokemon.name + " with " + pokemon.health + " health.",
                    "alertActionLocKey": "Catch it!",
                    "payload": pokemon.location
                }
            };

            body = {
                query: query,
                variables: variables
            };

            options.body = body;
            return request(options, (error, response, body) => {
                console.log("Completed! Now go catch that Pokemon!");
                if (error) throw new Error(error);
                console.log(JSON.stringify(body));
                resolve(body);
            });
        })
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